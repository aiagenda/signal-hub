import type { SourceCategory } from "../types/index.js";

/** Categories that participate in RSS scouting (excludes `other`). */
export type RssScoutCategory = Exclude<SourceCategory, "other">;

export const RSS_SCOUT_CATEGORIES: readonly RssScoutCategory[] = [
  "global_ai",
  "tool_radar",
  "builder_insights",
  "budapest_events",
  "weekend",
] as const;

/** AI + builder / tool stack only (no local weekend bucket). */
export const TECH_STACK_SCOUT_CATEGORIES: readonly RssScoutCategory[] = [
  "global_ai",
  "tool_radar",
  "builder_insights",
] as const;

export function isRssScoutCategory(s: string): s is RssScoutCategory {
  return (RSS_SCOUT_CATEGORIES as readonly string[]).includes(s);
}

export function getRssScoutSystemPrompt(category: RssScoutCategory): string {
  const commonFooter = `Given the title and optional excerpt of a single article, produce:
1) "summary": 1-2 sentences in Hungarian, newsletter tone, no clickbait, concrete facts when possible.
2) "score": integer 0-100 for how valuable this story is for that audience (see bucket below). Penalize pure PR, thin rewrites, or topics with no clear angle.

Respond with valid JSON only: {"summary":"...","score":72}
No markdown, no extra keys.`;

  const bucket: Record<RssScoutCategory, string> = {
    global_ai:
      "Bucket: GLOBAL AI — models, regulation, major platform moves, research with clear impact on builders and operators in CEE.",
    tool_radar:
      "Bucket: TOOL RADAR — dev tools, AI SDKs, infra, CLI, editors, and shipping workflows that save real time for product teams.",
    builder_insights:
      "Bucket: BUILDER / OPERATOR — pricing, GTM, hiring, fundraising, and execution lessons for founders and operators (not pure hype).",
    budapest_events:
      "Bucket: BUDAPEST TECH & BUSINESS — local companies, funding, hires, openings, and policy relevant to the Budapest/CEE scene.",
    weekend:
      "Bucket: WEEKEND / CULTURE — curated outings, food, culture, and city life around Budapest and Pest county (actionable, not generic tourism spam).",
  };

  return `You are an editor for "Budapest Signal", a weekly newsletter for builders, founders, and operators in Budapest and Central Europe.

${bucket[category]}

${commonFooter}`;
}
