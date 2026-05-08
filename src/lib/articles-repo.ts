import { getSupabaseAnonClient } from "@/lib/supabase-browser";
import type { Article } from "@/lib/article-types";

type DbArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[] | null;
  status: "draft" | "seo_ready" | "published" | "archived";
  published_at: string | null;
  created_at: string;
};

function mapDbArticle(row: DbArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    bodyMarkdown: row.body_markdown,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    keywords: row.keywords ?? [],
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

const articleSelect = `
  id,
  slug,
  title,
  excerpt,
  body_markdown,
  seo_title,
  seo_description,
  keywords,
  status,
  published_at,
  created_at
`;

export async function fetchPublishedArticles(): Promise<Article[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("articles")
    .select(articleSelect)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchPublishedArticles", error.message);
    throw new Error(error.message);
  }

  return (data as DbArticleRow[]).map(mapDbArticle);
}

export async function fetchPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("articles")
    .select(articleSelect)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("fetchPublishedArticleBySlug", error.message);
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapDbArticle(data as DbArticleRow);
}

export type SitemapArticle = { slug: string; published_at: string | null };

export async function fetchPublishedArticleSlugs(): Promise<SitemapArticle[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchPublishedArticleSlugs", error.message);
    throw new Error(error.message);
  }
  return (data ?? []) as SitemapArticle[];
}
