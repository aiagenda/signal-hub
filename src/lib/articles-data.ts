import type { Article } from "@/lib/article-types";
import { fetchPublishedArticleBySlug, fetchPublishedArticles } from "@/lib/articles-repo";

function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function getPublicArticlesList(): Promise<Article[]> {
  if (!hasSupabaseEnv()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[Budapest Signal] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for articles.");
    }
    return [];
  }
  try {
    return await fetchPublishedArticles();
  } catch (e) {
    console.error("[Budapest Signal] getPublicArticlesList failed", e);
    return [];
  }
}

export async function getPublicArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    return await fetchPublishedArticleBySlug(slug);
  } catch (e) {
    console.error("[Budapest Signal] getPublicArticleBySlug failed", e);
    return null;
  }
}
