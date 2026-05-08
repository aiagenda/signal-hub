import type { AgentEnv } from "../config/env.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { RssScoutCategory } from "../agents/rssScoutPrompts.js";
import { RSS_SCOUT_CATEGORIES } from "../agents/rssScoutPrompts.js";
import { runRssScoutWorkflow } from "./runRssScout.js";
import { log } from "../utils/logger.js";

export function parseScoutParallelArgs(argv: string[]): { parallel: boolean; concurrency: number } {
  const parallel = argv.includes("--parallel");
  const raw = argv.find((a) => a.startsWith("--concurrency="));
  let concurrency = 2;
  if (raw) {
    const n = Number.parseInt(raw.slice("--concurrency=".length), 10);
    if (Number.isFinite(n) && n >= 1) concurrency = Math.min(n, 5);
  }
  return { parallel, concurrency };
}

export async function runScoutAllSequential(env: AgentEnv): Promise<void> {
  const supabase = createServiceSupabaseClient(env);
  let total = 0;
  for (const category of RSS_SCOUT_CATEGORIES) {
    const { itemsProcessed } = await runRssScoutWorkflow(env, supabase, category);
    total += itemsProcessed;
  }
  log.info("scout_all_complete", {
    mode: "sequential",
    categories: RSS_SCOUT_CATEGORIES.length,
    totalItems: total,
  });
}

export async function runScoutAllParallel(env: AgentEnv, concurrency: number): Promise<void> {
  const supabase = createServiceSupabaseClient(env);
  const categories = [...RSS_SCOUT_CATEGORIES];
  const counts: number[] = new Array(categories.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const j = next;
      next += 1;
      if (j >= categories.length) return;
      const category = categories[j]!;
      const { itemsProcessed } = await runRssScoutWorkflow(env, supabase, category);
      counts[j] = itemsProcessed;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, categories.length) }, () => worker());
  await Promise.all(workers);
  const total = counts.reduce((a, b) => a + (b ?? 0), 0);
  log.info("scout_all_complete", {
    mode: "parallel",
    concurrency,
    categories: categories.length,
    totalItems: total,
  });
}

export async function runScoutCategoriesParallel(
  env: AgentEnv,
  categories: readonly RssScoutCategory[],
  concurrency: number,
): Promise<void> {
  const supabase = createServiceSupabaseClient(env);
  const cats = [...categories];
  if (cats.length === 0) {
    log.warn("scout_categories_empty", { message: "No categories to scout" });
    return;
  }
  const counts: number[] = new Array(cats.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const j = next;
      next += 1;
      if (j >= cats.length) return;
      const category = cats[j]!;
      const { itemsProcessed } = await runRssScoutWorkflow(env, supabase, category);
      counts[j] = itemsProcessed;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, cats.length) }, () => worker());
  await Promise.all(workers);
  const total = counts.reduce((a, b) => a + (b ?? 0), 0);
  log.info("scout_categories_complete", {
    mode: "parallel",
    concurrency,
    categories: cats,
    totalItems: total,
  });
}
