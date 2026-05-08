import type { SourceCategory } from "../types/index.js";

/** Maps workflow keys to DB enum values on `sources.category`. */
export const SCOUT_CATEGORY_BY_WORKFLOW = {
  global_ai: "global_ai" satisfies SourceCategory,
  tools: "tool_radar" satisfies SourceCategory,
  budapest_events: "budapest_events" satisfies SourceCategory,
  weekend: "weekend" satisfies SourceCategory,
} as const;
