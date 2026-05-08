import "dotenv/config";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ContentDirectorAgent, SECTION_ORDER, type DraftPlan } from "../agents/ContentDirectorAgent.js";
import type { AgentEnv } from "../config/env.js";
import { loadEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { slugifyTitle } from "../utils/slug.js";

const dryRun = process.argv.includes("--dry-run");

export type DraftEditionResult = {
  editionId?: string;
  itemsInserted: number;
  draftItems: number;
  dryRun: boolean;
};

function countDraftItems(plan: DraftPlan): number {
  return plan.sections.reduce((n, s) => n + s.items.length, 0);
}

async function getNextEditionNumber(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("editions")
    .select("number")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getNextEditionNumber: ${error.message}`);
  }
  return ((data?.number as number | undefined) ?? 0) + 1;
}

async function ensureUniqueSlug(
  supabase: SupabaseClient,
  number: number,
  base: string
): Promise<string> {
  let suffix = "";
  for (let i = 0; i < 25; i += 1) {
    const slug = `edition-${String(number).padStart(3, "0")}-${base}${suffix}`;
    const { data, error } = await supabase.from("editions").select("id").eq("slug", slug).maybeSingle();
    if (error) {
      throw new Error(`slug check failed: ${error.message}`);
    }
    if (!data) return slug;
    suffix = `-${i + 2}`;
  }
  throw new Error("Nem sikerült egyedi slugot allokálni");
}

type UrlMeta = { canonical_url: string; default_source_label: string | null };

async function loadUrlMeta(
  supabase: SupabaseClient,
  plan: DraftPlan
): Promise<Map<string, UrlMeta>> {
  const ids = new Set<string>();
  for (const sec of plan.sections) {
    for (const it of sec.items) {
      ids.add(it.content_item_id);
    }
  }
  const idList = [...ids];
  if (idList.length === 0) {
    return new Map();
  }

  const { data: rows, error } = await supabase
    .from("content_items")
    .select("id,canonical_url,source_id")
    .in("id", idList);

  if (error) {
    throw new Error(`content_items meta query failed: ${error.message}`);
  }

  const sourceIds = [...new Set((rows ?? []).map((r) => r.source_id as string).filter(Boolean))];
  const sourceNameById = new Map<string, string>();
  if (sourceIds.length > 0) {
    const { data: srcRows, error: srcErr } = await supabase
      .from("sources")
      .select("id,name")
      .in("id", sourceIds);
    if (srcErr) {
      throw new Error(`sources meta query failed: ${srcErr.message}`);
    }
    for (const s of srcRows ?? []) {
      sourceNameById.set(s.id as string, String(s.name));
    }
  }

  const map = new Map<string, UrlMeta>();
  for (const r of rows ?? []) {
    const sid = r.source_id as string;
    map.set(r.id as string, {
      canonical_url: String(r.canonical_url),
      default_source_label: sid ? sourceNameById.get(sid) ?? null : null,
    });
  }
  return map;
}

async function persistDraft(
  supabase: SupabaseClient,
  plan: DraftPlan
): Promise<{ editionId: string; itemsInserted: number }> {
  const urlMeta = await loadUrlMeta(supabase, plan);
  const nextNumber = await getNextEditionNumber(supabase);
  const slug = await ensureUniqueSlug(supabase, nextNumber, slugifyTitle(plan.edition_title, 72));

  const { data: edition, error: eErr } = await supabase
    .from("editions")
    .insert({
      slug,
      number: nextNumber,
      title: plan.edition_title,
      description: plan.edition_description,
      intro: plan.edition_intro,
      tags: plan.tags,
      edition_date: new Date().toISOString().slice(0, 10),
      status: "draft",
    })
    .select("id")
    .single();

  if (eErr || !edition) {
    throw new Error(`edition insert failed: ${eErr?.message ?? "no row"}`);
  }

  const editionId = edition.id as string;
  let itemsInserted = 0;

  for (const sec of plan.sections) {
    const { data: secRow, error: sErr } = await supabase
      .from("edition_sections")
      .insert({
        edition_id: editionId,
        section_key: sec.section_key,
        title: sec.title,
        body: sec.body,
        sort_order: SECTION_ORDER.indexOf(sec.section_key),
      })
      .select("id")
      .single();

    if (sErr || !secRow) {
      throw new Error(`edition_sections insert failed: ${sErr?.message ?? "no row"}`);
    }

    const sectionId = secRow.id as string;
    let sortOrder = 0;
    for (const it of sec.items) {
      const meta = urlMeta.get(it.content_item_id);
      const url = meta?.canonical_url ?? "";
      const sourceLabel =
        it.source_label?.trim() ||
        meta?.default_source_label ||
        null;

      const { error: iErr } = await supabase.from("edition_items").insert({
        edition_section_id: sectionId,
        content_item_id: it.content_item_id,
        title: it.title,
        summary: it.summary,
        source_label: sourceLabel,
        url,
        sort_order: sortOrder,
      });

      if (iErr) {
        throw new Error(`edition_items insert failed: ${iErr.message}`);
      }

      sortOrder += 1;
      itemsInserted += 1;
    }
  }

  log.info("draft_persisted", { editionId, slug, itemsInserted });
  return { editionId, itemsInserted };
}

/**
 * Run ContentDirector draft with agent_runs logging (for CLI and weekly pipeline).
 */
export async function runDraftEditionWorkflow(
  env: AgentEnv,
  supabase: SupabaseClient,
  options: { dryRun: boolean },
): Promise<DraftEditionResult> {
  const { dryRun: isDryRun } = options;

  const startedAt = new Date().toISOString();
  const { data: runRow, error: insertErr } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "ContentDirectorAgent",
      status: "running",
      started_at: startedAt,
      metadata: { workflow: "draft:edition", dry_run: isDryRun },
    })
    .select("id")
    .single();

  if (insertErr || !runRow) {
    log.error("agent_run_insert_failed", { message: insertErr?.message });
    throw new Error(`Could not create agent_runs row: ${insertErr?.message}`);
  }

  const runId = runRow.id as string;

  try {
    const agent = new ContentDirectorAgent(env, { supabase });
    const { plan, stats, styleRuleMeta } = await agent.buildDraft();

    const draftItems = countDraftItems(plan);

    if (isDryRun) {
      process.stdout.write(`${JSON.stringify({ plan, stats, styleRuleMeta }, null, 2)}\n`);

      const finishedAt = new Date().toISOString();
      const { error: doneErr } = await supabase
        .from("agent_runs")
        .update({
          status: "success",
          finished_at: finishedAt,
          items_processed: draftItems,
          error_message: null,
          metadata: {
            workflow: "draft:edition",
            dry_run: true,
            stats,
            plan,
            style_rule_id: styleRuleMeta.id,
            style_rule_version: styleRuleMeta.version,
          },
        })
        .eq("id", runId);

      if (doneErr) {
        log.error("agent_run_dry_run_update_failed", { runId, message: doneErr.message });
        throw new Error(doneErr.message);
      }

      log.info("draft_edition_dry_run_success", {
        runId,
        draftItems,
        considered: stats.considered,
      });
      return { itemsInserted: 0, draftItems, dryRun: true };
    }

    const { editionId, itemsInserted } = await persistDraft(supabase, plan);

    const finishedAt = new Date().toISOString();
    const { error: doneErr } = await supabase
      .from("agent_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        items_processed: itemsInserted,
        error_message: null,
        metadata: {
          workflow: "draft:edition",
          dry_run: false,
          edition_id: editionId,
          stats,
          style_rule_id: styleRuleMeta.id,
          style_rule_version: styleRuleMeta.version,
        },
      })
      .eq("id", runId);

    if (doneErr) {
      log.error("agent_run_success_update_failed", { runId, message: doneErr.message });
      throw new Error(doneErr.message);
    }

    log.info("draft_edition_success", { runId, editionId, itemsInserted });
    return { editionId, itemsInserted, draftItems, dryRun: false };
  } catch (e) {
    const message = e instanceof Error ? (e.stack ?? e.message) : String(e);
    const finishedAt = new Date().toISOString();

    const { error: failErr } = await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_message: message.slice(0, 8000),
      })
      .eq("id", runId);

    if (failErr) {
      log.error("agent_run_failed_update_failed", { runId, message: failErr.message });
    }

    log.error("draft_edition_failed", { runId, message });
    throw e;
  }
}

async function main() {
  const env = loadEnv();
  const supabase = createServiceSupabaseClient(env);

  try {
    await runDraftEditionWorkflow(env, supabase, { dryRun });
    process.exitCode = 0;
  } catch {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  log.error("draft_edition_fatal", { message: msg });
  process.exitCode = 1;
});
