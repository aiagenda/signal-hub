export type SourceCategory =
  | "global_ai"
  | "tool_radar"
  | "builder_insights"
  | "budapest_events"
  | "weekend"
  | "other";

export type ContentStatus = "draft" | "review" | "approved" | "rejected";

export type EditionStatus = "draft" | "published" | "archived";

export type AgentRunStatus = "running" | "success" | "failed";

export type SourceRow = {
  id: string;
  name: string;
  base_url: string | null;
  feed_url: string | null;
  category: SourceCategory;
  active: boolean;
  created_at: string;
};

export type ContentItemRow = {
  id: string;
  source_id: string;
  category: SourceCategory;
  title: string;
  canonical_url: string;
  summary: string | null;
  raw_excerpt: string | null;
  status: ContentStatus;
  score: string | null;
  external_guid: string | null;
  content_hash: string;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
};
