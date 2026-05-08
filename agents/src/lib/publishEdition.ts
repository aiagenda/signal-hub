import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "../utils/logger.js";

/** Set the edition created in this pipeline run to published (explicit operator/CI opt-in). */
export async function publishEditionById(
  supabase: SupabaseClient,
  editionId: string,
): Promise<{ slug: string; number: number }> {
  const publishedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("editions")
    .update({
      status: "published",
      published_at: publishedAt,
    })
    .eq("id", editionId)
    .eq("status", "draft")
    .select("slug, number")
    .single();

  if (error) {
    throw new Error(`publishEditionById: ${error.message}`);
  }
  if (!data) {
    throw new Error("publishEditionById: no row updated (wrong id or not draft?)");
  }

  log.info("edition_published", { editionId, slug: data.slug, number: data.number });
  return { slug: data.slug as string, number: data.number as number };
}
