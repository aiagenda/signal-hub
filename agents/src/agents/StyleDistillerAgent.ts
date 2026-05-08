import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { log } from "../utils/logger.js";

const OBSERVATION_LIMIT = 80;
const LOOKBACK_DAYS = 14;

const DISTILL_SYSTEM = `Te szerkesztőségi stílus-stratéga vagy. Kapni fogsz rövid szövegkivonatokat különböző tech/üzleti oldalakról.

Feladatod NEM szöveg másolása, hanem általánosítható szabályok és egy rövid prompt-snippet gyártása a "Budapest Signal" hírlevélhez (magyar közönség, builder/founder hang, prémium, nem generikus).

Válasz KIZÁRÓLAG JSON:
{
  "prompt_snippet": "<string, max ~1200 karakter — közvetlenül beilleszthető instrukció a szerkesztői hanghoz>",
  "rules_json": {
    "must": ["..."],
    "avoid": ["..."],
    "structure": ["..."],
    "budapest_angle": "<1 mondat>"
  }
}

A rules_json kulcsai rugalmasak lehetnek, de legyenek tömör, működőképes szabályok.`;

export class StyleDistillerAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  /**
   * Reads recent style_observations, distills into a new style_rules row (active = false).
   */
  async run(): Promise<{ newVersion: number; ruleId: string }> {
    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    const { data: obs, error: obsErr } = await this.supabase
      .from("style_observations")
      .select("id,source_id,observation_json,created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(OBSERVATION_LIMIT);

    if (obsErr) {
      throw new Error(`style_observations query failed: ${obsErr.message}`);
    }

    let rows = obs ?? [];
    if (rows.length === 0) {
      const { data: fallback, error: fbErr } = await this.supabase
        .from("style_observations")
        .select("id,source_id,observation_json,created_at")
        .order("created_at", { ascending: false })
        .limit(OBSERVATION_LIMIT);

      if (fbErr) {
        throw new Error(`style_observations fallback query failed: ${fbErr.message}`);
      }
      rows = fallback ?? [];
    }

    if (rows.length === 0) {
      throw new Error(
        "Nincs style_observations sor. Futtasd: npm run style:scout"
      );
    }

    const bundle = rows.map((r) => ({
      observation_json: r.observation_json,
      created_at: r.created_at,
    }));

    const { data: verRow, error: verErr } = await this.supabase
      .from("style_rules")
      .select("version")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verErr) {
      throw new Error(`style_rules version query failed: ${verErr.message}`);
    }

    const nextVersion = (typeof verRow?.version === "number" ? verRow.version : 0) + 1;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.35,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DISTILL_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            observation_count: rows.length,
            observations: bundle,
          }),
        },
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
      throw new Error(`JSON parse hiba: ${raw.slice(0, 400)}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Érvénytelen válasz");
    }

    const o = parsed as Record<string, unknown>;
    const prompt_snippet = String(o.prompt_snippet ?? "").trim();
    const rules_json = o.rules_json;

    if (!prompt_snippet) {
      throw new Error("Hiányzó prompt_snippet");
    }
    if (typeof rules_json !== "object" || rules_json === null) {
      throw new Error("Hiányzó rules_json objektum");
    }

    const { data: inserted, error: insErr } = await this.supabase
      .from("style_rules")
      .insert({
        version: nextVersion,
        prompt_snippet,
        rules_json,
        active: false,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      throw new Error(`style_rules insert failed: ${insErr?.message ?? "no row"}`);
    }

    const ruleId = inserted.id as string;
    log.info("style_distill_created", { ruleId, version: nextVersion });

    return { newVersion: nextVersion, ruleId };
  }
}
