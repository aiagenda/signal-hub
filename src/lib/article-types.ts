export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords: string[];
  status: "draft" | "seo_ready" | "published" | "archived";
  publishedAt?: string | null;
  createdAt: string;
};
