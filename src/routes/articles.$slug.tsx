import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublicArticleBySlug } from "@/lib/articles-data";
import { articleCanonicalUrl, buildLongformArticleJsonLd } from "@/lib/seo";
import { getOgImageAbsoluteUrl } from "@/lib/public-env";

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderMarkdownish(body: string): ReactNode[] {
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, idx) => {
      if (part.startsWith("### ")) {
        return (
          <h3 key={`h3-${idx}`} className="mt-8 font-display text-2xl leading-snug text-foreground">
            {part.replace(/^###\s+/, "")}
          </h3>
        );
      }
      if (part.startsWith("## ")) {
        return (
          <h2 key={`h2-${idx}`} className="mt-10 font-display text-3xl leading-snug text-foreground">
            {part.replace(/^##\s+/, "")}
          </h2>
        );
      }
      if (part.startsWith("- ")) {
        const lines = part
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("- "));
        return (
          <ul key={`ul-${idx}`} className="my-4 list-disc space-y-1 pl-6 text-foreground/90">
            {lines.map((line, i) => (
              <li key={`li-${idx}-${i}`}>{line.replace(/^-+\s*/, "")}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={`p-${idx}`} className="my-4 whitespace-pre-wrap leading-relaxed text-foreground/90">
          {part}
        </p>
      );
    });
}

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    const article = await getPublicArticleBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const { article } = loaderData;
    const canonical = articleCanonicalUrl(article.slug);
    const desc = article.seoDescription || article.excerpt || article.title;
    const jsonLd = buildLongformArticleJsonLd(article);
    return {
      meta: [
        { title: `${article.seoTitle || article.title} — Budapest Signal` },
        { name: "description", content: desc },
        { property: "og:title", content: article.seoTitle || article.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: getOgImageAbsoluteUrl() },
        { property: "article:published_time", content: article.publishedAt ?? article.createdAt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: getOgImageAbsoluteUrl() },
        { "script:ld+json": jsonLd as Record<string, unknown> },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ArticleDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">Cikk nem talalhato</p>
        <Link to="/articles" className="mt-4 inline-block text-foreground underline">
          Vissza a cikkekhez
        </Link>
      </div>
    </div>
  ),
});

function ArticleDetailPage() {
  const { article } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="border-b border-border/50">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Osszes cikk
          </Link>

          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-signal">
            {formatDate(article.publishedAt ?? article.createdAt)}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">{article.title}</h1>
          {article.excerpt ? (
            <p className="mt-6 text-xl leading-relaxed text-muted-foreground">{article.excerpt}</p>
          ) : null}

          {article.keywords.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {article.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {k}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      <div className="mx-auto max-w-3xl px-5 py-16">{renderMarkdownish(article.bodyMarkdown)}</div>

      <div className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-2xl border border-signal/30 bg-card-gradient p-8 text-center shadow-glow">
          <h3 className="font-display text-2xl">Kapd meg a kovetkezo jelet a postaladadba.</h3>
          <p className="mt-2 text-sm text-muted-foreground">Szerdankent 07:00 CET. Egy briefing. Nincs zaj.</p>
          <div className="mt-5 flex justify-center">
            <SubscribeForm compact />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
