import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "../config/openai.js";
import { createServiceSupabaseClient } from "../config/supabase.js";
import type { AgentEnv } from "../config/env.js";

type Platform = "linkedin" | "x" | "facebook" | "telegram";

export class SocialDraftAgent {
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(env: AgentEnv, options?: { supabase?: SupabaseClient; openai?: OpenAI }) {
    this.supabase = options?.supabase ?? createServiceSupabaseClient(env);
    this.openai = options?.openai ?? createOpenAIClient(env);
    this.model = env.OPENAI_MODEL;
  }

  async draftForArticle(articleId: string, baseUrl?: string): Promise<{ inserted: number }> {
    const { data: article, error } = await this.supabase
      .from("articles")
      .select("id,slug,title,excerpt,status")
      .eq("id", articleId)
      .maybeSingle();

    if (error) throw new Error(`SocialDraftAgent article query failed: ${error.message}`);
    if (!article) throw new Error(`article ${articleId} not found`);

    const urlBase = (baseUrl ?? "").trim().replace(/\/+$/, "");
    const articleUrl = urlBase ? `${urlBase}/articles/${article.slug}` : undefined;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Te social editor vagy. Adj vissza JSON-t: {linkedin,x,facebook,telegram}. Mindegyik rovid, termeszetes magyar poszt legyen; x max ~240 char.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: article.title,
            excerpt: article.excerpt,
            url: articleUrl,
            audience: "hungarian tech founders/operators",
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("SocialDraftAgent empty OpenAI content");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`SocialDraftAgent JSON parse failed: ${raw.slice(0, 200)}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("SocialDraftAgent invalid JSON object");
    }

    const p = parsed as Record<string, unknown>;
    const platforms: Platform[] = ["linkedin", "x", "facebook", "telegram"];
    let inserted = 0;

    for (const platform of platforms) {
      const postText = String(p[platform] ?? "").trim();
      if (!postText) continue;
      const { error: insErr } = await this.supabase.from("social_posts").insert({
        article_id: articleId,
        platform,
        post_text: postText,
        post_url: articleUrl ?? null,
        status: "draft",
        metadata: { generated_by: "SocialDraftAgent" },
      });
      if (insErr) throw new Error(`SocialDraftAgent insert failed: ${insErr.message}`);
      inserted += 1;
    }

    return { inserted };
  }
}
