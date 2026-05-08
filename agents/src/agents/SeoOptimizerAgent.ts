import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { slugifyTitle } from "../utils/slug.js";

export class SeoOptimizerAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  private async ensureUniqueSlug(base: string, articleId: string): Promise<string> {
    const candidate = slugifyTitle(base, 72);
    let suffix = 0;
    while (suffix < 25) {
      const slug = suffix === 0 ? candidate : `${candidate}-${suffix + 1}`;
      const { data, error } = await this.supabase
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .neq("id", articleId)
        .maybeSingle();
      if (error) throw new Error(`seo slug lookup failed: ${error.message}`);
      if (!data) return slug;
      suffix += 1;
    }
    return candidate;
  }

  async optimizeArticle(articleId: string): Promise<{ slug: string }> {
    const { data: article, error } = await this.supabase
      .from("articles")
      .select("id,title,excerpt,body_markdown,seo_title,seo_description,keywords")
      .eq("id", articleId)
      .maybeSingle();

    if (error) throw new Error(`SeoOptimizerAgent article query failed: ${error.message}`);
    if (!article) throw new Error(`article ${articleId} not found`);

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Te egy technikai SEO szerkeszto vagy. Adj vissza tiszta JSON-ban: {seo_title,seo_description,slug,tags}. seo_title max 60 char, seo_description max 155 char, slug latin-kebab.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: article.title,
            excerpt: article.excerpt,
            body_markdown: article.body_markdown,
            existing_keywords: article.keywords,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("SeoOptimizerAgent empty OpenAI content");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`SeoOptimizerAgent JSON parse failed: ${raw.slice(0, 250)}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("SeoOptimizerAgent invalid JSON object");
    }

    const p = parsed as Record<string, unknown>;
    const seoTitle = String(p.seo_title ?? "").trim() || String(article.title);
    const seoDescription = String(p.seo_description ?? "").trim() || String(article.excerpt ?? "").slice(0, 155);
    const rawSlug = String(p.slug ?? "").trim() || String(article.title);
    const tags = Array.isArray(p.tags)
      ? p.tags.map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : Array.isArray(article.keywords)
        ? article.keywords.map((x) => String(x))
        : [];

    const slug = await this.ensureUniqueSlug(rawSlug, String(article.id));

    const { error: updErr } = await this.supabase
      .from("articles")
      .update({
        slug,
        seo_title: seoTitle.slice(0, 120),
        seo_description: seoDescription.slice(0, 220),
        keywords: tags,
        status: "seo_ready",
      })
      .eq("id", articleId);

    if (updErr) throw new Error(`SeoOptimizerAgent update failed: ${updErr.message}`);
    return { slug };
  }
}
