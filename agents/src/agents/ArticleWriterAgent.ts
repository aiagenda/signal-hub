import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";
import { slugifyTitle } from "../utils/slug.js";
import { evaluateArticleQuality } from "../lib/articleQualityGate.js";

type TopicRow = {
  id: string;
  title: string;
  angle: string;
  primary_keyword: string;
  source_content_item_ids: string[];
};

export class ArticleWriterAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  private wordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  private async generateArticlePayload(topic: TopicRow, sourceItems: unknown[]): Promise<{
    title: string;
    excerpt: string;
    body: string;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: string[];
  }> {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.6,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            [
              "Te egy magyar tech/uzleti magazin senior szerzoje vagy.",
              "Irj teljes, publikalhato longform cikket.",
              "A cikk legyen legalabb 700 szo, celzottan 700-1200 szo.",
              "Kotelezo szerkezet: bevezeto kontextus, 2-4 kulcs fejlemeny, miert fontos, gyakorlati kovetkezo lepesek.",
              "A body_markdown-ban kotelezo minimum 3 alcim (## vagy ###), konkret allitasokkal.",
              "Ne irj altalanos blabla szoveget, legyen adatalapu, forrasokra tamaszkodo, operativ tanacsokkal.",
              "Csak JSON-t adj vissza: {title,excerpt,seo_title,seo_description,tags,body_markdown}.",
            ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            topic: {
              title: topic.title,
              angle: topic.angle,
              primary_keyword: topic.primary_keyword,
            },
            source_items: sourceItems,
            constraints: {
              language: "hu",
              audience: "budapest founders/builders/operators",
              include_sections: ["context", "what happened", "why it matters", "what to do next"],
              min_length_words: 700,
              target_length_words: "700-1200",
            },
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("ArticleWriterAgent got empty OpenAI content");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`ArticleWriterAgent JSON parse failed: ${raw.slice(0, 300)}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("ArticleWriterAgent invalid JSON object");
    }

    const p = parsed as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    const excerpt = String(p.excerpt ?? "").trim();
    const body = String(p.body_markdown ?? "").trim();
    const seoTitle = String(p.seo_title ?? "").trim() || null;
    const seoDescription = String(p.seo_description ?? "").trim() || null;
    const tags = Array.isArray(p.tags)
      ? p.tags.map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : [];

    if (!title || !body) {
      throw new Error("ArticleWriterAgent output missing title/body_markdown");
    }

    return { title, excerpt, body, seoTitle, seoDescription, tags };
  }

  private async rewriteArticlePayload(
    topic: TopicRow,
    sourceItems: unknown[],
    draft: {
      title: string;
      excerpt: string;
      body: string;
      seoTitle: string | null;
      seoDescription: string | null;
      tags: string[];
    },
    qualityIssues: string[],
  ) {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Te magyar szerkeszto vagy. Rewrite pass: javitsd a draft cikket quality gate alapjan, tartsd meg a lenyeget, de legyen legalabb 700 szo, legalabb 3 alcim, eros SEO mezok. Csak JSON: {title,excerpt,seo_title,seo_description,tags,body_markdown}.",
        },
        {
          role: "user",
          content: JSON.stringify({
            topic: {
              title: topic.title,
              angle: topic.angle,
              primary_keyword: topic.primary_keyword,
            },
            source_items: sourceItems,
            draft,
            issues_to_fix: qualityIssues,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("ArticleWriterAgent rewrite got empty OpenAI content");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const title = String(parsed.title ?? "").trim();
    const excerpt = String(parsed.excerpt ?? "").trim();
    const body = String(parsed.body_markdown ?? "").trim();
    const seoTitle = String(parsed.seo_title ?? "").trim() || null;
    const seoDescription = String(parsed.seo_description ?? "").trim() || null;
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : [];
    if (!title || !body) throw new Error("ArticleWriterAgent rewrite missing title/body_markdown");
    return { title, excerpt, body, seoTitle, seoDescription, tags };
  }

  private async ensureUniqueSlug(baseTitle: string): Promise<string> {
    const base = slugifyTitle(baseTitle, 72);
    let suffix = 0;
    while (suffix < 25) {
      const slug = suffix === 0 ? base : `${base}-${suffix + 1}`;
      const { data, error } = await this.supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
      if (error) throw new Error(`slug lookup failed: ${error.message}`);
      if (!data) return slug;
      suffix += 1;
    }
    throw new Error("could not allocate unique article slug");
  }

  async writeFromTopic(topicId: string): Promise<{ articleId: string; slug: string }> {
    const { data: topic, error: topicErr } = await this.supabase
      .from("topic_ideas")
      .select("id,title,angle,primary_keyword,source_content_item_ids")
      .eq("id", topicId)
      .maybeSingle();

    if (topicErr) throw new Error(`topic query failed: ${topicErr.message}`);
    if (!topic) throw new Error(`topic ${topicId} not found`);

    const t = topic as TopicRow;

    const ids = (t.source_content_item_ids ?? []).map((x) => String(x)).filter(Boolean);
    if (ids.length === 0) throw new Error("topic has no source_content_item_ids");

    const { data: items, error: itemErr } = await this.supabase
      .from("content_items")
      .select("id,title,summary,canonical_url,score,category")
      .in("id", ids);

    if (itemErr) throw new Error(`content_items query failed: ${itemErr.message}`);

    const sourceItems = items ?? [];
    let payload = await this.generateArticlePayload(t, sourceItems);

    let report = evaluateArticleQuality({
      title: payload.title,
      excerpt: payload.excerpt,
      bodyMarkdown: payload.body,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
      keywords: payload.tags,
    });

    if (!report.passed || report.score < 85) {
      payload = await this.rewriteArticlePayload(t, sourceItems, payload, report.issues);
      report = evaluateArticleQuality({
        title: payload.title,
        excerpt: payload.excerpt,
        bodyMarkdown: payload.body,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        keywords: payload.tags,
      });
    }

    const bodyWordCount = this.wordCount(payload.body);

    const slug = await this.ensureUniqueSlug(payload.title);

    const { data: inserted, error: insErr } = await this.supabase
      .from("articles")
      .insert({
        topic_idea_id: t.id,
        slug,
        title: payload.title,
        excerpt: payload.excerpt || null,
        body_markdown: payload.body,
        seo_title: payload.seoTitle,
        seo_description: payload.seoDescription,
        keywords: payload.tags,
        status: "draft",
        metadata: {
          generated_by: "ArticleWriterAgent",
          source_content_item_ids: ids,
          primary_keyword: t.primary_keyword,
          angle: t.angle,
          body_word_count: bodyWordCount,
          quality_note: report.passed ? "ok" : "rewrite_completed_but_gate_has_warnings_or_fails",
          quality_score: report.score,
          quality_issues: report.issues,
        },
      })
      .select("id,slug")
      .single();

    if (insErr || !inserted) {
      throw new Error(`ArticleWriterAgent insert failed: ${insErr?.message ?? "no row"}`);
    }

    await this.supabase.from("topic_ideas").update({ status: "used" }).eq("id", t.id);

    return { articleId: String(inserted.id), slug: String(inserted.slug) };
  }
}
