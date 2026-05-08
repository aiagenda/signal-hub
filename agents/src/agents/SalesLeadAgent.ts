import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { fetchHtml } from "../sources/htmlFetcher.js";
import { stripHtmlToText } from "../utils/html.js";
import { log } from "../utils/logger.js";

export type SponsorLeadRow = {
  id: string;
  company: string;
  contact_name: string | null;
  email: string;
  category: string | null;
  message: string | null;
  status: string;
  website_url: string | null;
  created_at: string;
  outreach_prepared_at?: string | null;
};

export type LeadRecommendation = {
  fit_score: number;
  company_summary: string;
  recommended_ad_angle: string;
  outreach_email: string;
  sponsored_placement_copy: string;
  website_fetch_note?: string | null;
  prepared_at?: string;
};

const SYSTEM_PROMPT = `Te a Budapest Signal üzletfejlesztési asszisztensed vagy. A Budapest Signal heti hírlevél és média: AI, tech, üzlet, budapesti események és prémium életstílus iránt érdeklődő, növekvő közönség.

Feladat: egy potenciális szponzor / partner esetén értékeld az illeszkedést, és készíts szövegeket KÜLSŐ küldés előtt (ember jóváhagyja).

Hangnem: professzionális, tömör, prémium — nem spamelős, nem nyálas.

Kimenet KIZÁRÓLAG JSON (magyar szövegek az értékekben):
{
  "fit_score": <integer 0-100>,
  "company_summary": "<2-4 mondat: ki ők, mit csinálnak>",
  "recommended_ad_angle": "<1 rövid bekezdés: miért illik a Budapest Signalhoz, milyen szponzorációs szög>",
  "outreach_email": "<teljes rövid üzenet e-mailnek: tárgysor nélkül csak a levél teste; személyre szabható helyek [Név]-nel>",
  "sponsored_placement_copy": "<1 natív bekezdés mint a hírlevélben megjelenő szponzorált említés>"
}

Ne találj ki domain-specifikus tényeket: ha kevés az infó, írd nyíltan, hogy mit kellene még megerősíteni.`;

export class SalesLeadAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  /**
   * Loads pipeline rows: \`lead\` or \`new\`, only where \`outreach_prepared_at\` is still null
   * (so default inbound rows work without manually switching enum).
   */
  async run(): Promise<{
    processed: number;
    errors: Array<{ lead_id: string; message: string }>;
  }> {
    const { data: leads, error } = await this.supabase
      .from("sponsor_leads")
      .select(
        "id,company,contact_name,email,category,message,status,website_url,created_at,outreach_prepared_at"
      )
      .in("status", ["lead", "new"])
      .is("outreach_prepared_at", null);

    if (error) {
      throw new Error(`sponsor_leads query failed: ${error.message}`);
    }

    const list = (leads ?? []) as SponsorLeadRow[];
    if (list.length === 0) {
      const { count: totalSponsorLeads } = await this.supabase
        .from("sponsor_leads")
        .select("*", { count: "exact", head: true });

      const { count: newOrLeadCount } = await this.supabase
        .from("sponsor_leads")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "lead"]);

      const { count: eligibleCount, error: countErr } = await this.supabase
        .from("sponsor_leads")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "lead"])
        .is("outreach_prepared_at", null);

      if (countErr) {
        log.warn("sales_lead_diagnostic_count_failed", { message: countErr.message });
      }

      const total = totalSponsorLeads ?? 0;
      const nl = newOrLeadCount ?? 0;
      const el = eligibleCount ?? 0;

      let likelyReason: string;
      if (total === 0) {
        likelyReason = "A sponsor_leads tábla üres (írj be sort a Dashboardban, vagy futtass insertet).";
      } else if (nl === 0) {
        likelyReason =
          "Van sor, de egyik státusza sem new/lead (pl. contacted, won, lost) — állíts new-ra, vagy add hozzá a 'lead' enumot + migrációt.";
      } else if (el === 0) {
        likelyReason =
          "Van new/lead sor, de mindegyiknél már be van töltve outreach_prepared_at — töröld ezt a mezőt (NULL), ha újra akarod futtatni.";
      } else {
        likelyReason = "Ismeretlen (szinkron hiba?) — nézd a Supabase project ref-et a .env-ben.";
      }

      log.info("sales_lead_no_rows", {
        totalSponsorLeads: total,
        rowsWithStatusNewOrLead: nl,
        rowsEligibleUnprepared: el,
        likelyReason,
      });
      return { processed: 0, errors: [] };
    }

    let processed = 0;
    const errors: Array<{ lead_id: string; message: string }> = [];

    for (const lead of list) {
      try {
        let websiteFetchNote: string | null = null;
        let siteContext = "";

        const rawUrl = lead.website_url?.trim();
        if (rawUrl) {
          try {
            const normalized = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
            const html = await fetchHtml(normalized);
            siteContext = stripHtmlToText(html);
            if (!siteContext.length) {
              websiteFetchNote = "Oldal betöltve, de kevés szöveg lett kinyerve.";
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            websiteFetchNote = `Weboldal fetch hiba: ${msg}`;
            log.warn("sales_lead_site_fetch", { leadId: lead.id, message: msg });
          }
        }

        const rec = await this.enrichLead(lead, siteContext, websiteFetchNote);

        const payload: LeadRecommendation = {
          ...rec,
          website_fetch_note: websiteFetchNote,
          prepared_at: new Date().toISOString(),
        };

        const { error: upErr } = await this.supabase
          .from("sponsor_leads")
          .update({
            recommendations: payload as unknown as Record<string, unknown>,
            outreach_prepared_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        if (upErr) {
          throw new Error(upErr.message);
        }

        processed += 1;
        log.info("sales_lead_prepared", { leadId: lead.id, company: lead.company });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ lead_id: lead.id, message });
        log.error("sales_lead_row_failed", { leadId: lead.id, message });
      }
    }

    return { processed, errors };
  }

  private async enrichLead(
    lead: SponsorLeadRow,
    websitePlainText: string,
    websiteFetchNote: string | null
  ): Promise<Omit<LeadRecommendation, "website_fetch_note" | "prepared_at">> {
    const user = JSON.stringify(
      {
        company: lead.company,
        contact_name: lead.contact_name,
        email: lead.email,
        category: lead.category,
        inbound_message: lead.message,
        website_excerpt: websitePlainText || null,
        website_note: websiteFetchNote,
      },
      null,
      2
    );

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.45,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("OpenAI üres válasz");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`JSON parse hiba: ${raw.slice(0, 300)}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Érvénytelen JSON");
    }

    const o = parsed as Record<string, unknown>;
    const fit_score = Number(o.fit_score);
    const company_summary = String(o.company_summary ?? "").trim();
    const recommended_ad_angle = String(o.recommended_ad_angle ?? "").trim();
    const outreach_email = String(o.outreach_email ?? "").trim();
    const sponsored_placement_copy = String(o.sponsored_placement_copy ?? "").trim();

    if (!Number.isFinite(fit_score) || fit_score < 0 || fit_score > 100) {
      throw new Error(`Érvénytelen fit_score: ${String(o.fit_score)}`);
    }
    if (!company_summary || !recommended_ad_angle || !outreach_email || !sponsored_placement_copy) {
      throw new Error("Hiányzó mező a modell válaszából");
    }

    return {
      fit_score: Math.round(fit_score),
      company_summary,
      recommended_ad_angle,
      outreach_email,
      sponsored_placement_copy,
    };
  }
}
