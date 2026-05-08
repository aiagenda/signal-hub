import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublicEditionBySlug } from "@/lib/editions-data";
import { buildNewsArticleJsonLd, editionCanonicalUrl } from "@/lib/seo";
import { getOgImageAbsoluteUrl } from "@/lib/public-env";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/archive/$slug")({
  loader: async ({ params }) => {
    const edition = await getPublicEditionBySlug(params.slug);
    if (!edition) throw notFound();
    return { edition };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [] };
    }
    const { edition } = loaderData;
    const canonical = editionCanonicalUrl(edition.slug);
    const desc = edition.description || edition.intro.slice(0, 160);
    const jsonLd = buildNewsArticleJsonLd(edition);
    return {
      meta: [
        { title: `${edition.title} — Budapest Signal` },
        { name: "description", content: desc },
        { property: "og:title", content: edition.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: getOgImageAbsoluteUrl() },
        {
          property: "article:published_time",
          content: edition.publishedAt ?? `${edition.date}T07:00:00+01:00`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: getOgImageAbsoluteUrl() },
        { "script:ld+json": jsonLd as Record<string, unknown> },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: EditionDetail,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">
          Kiadás nem található
        </p>
        <Link to="/archive" className="mt-4 inline-block text-foreground underline">
          Vissza az archívumba
        </Link>
      </div>
    </div>
  ),
});

function EditionDetail() {
  const { edition } = Route.useLoaderData();
  const date = new Date(edition.date).toLocaleDateString("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="border-b border-border/50">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Link
            to="/archive"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Összes kiadás
          </Link>

          <div className="mt-8 flex items-center gap-3 text-xs">
            <span className="font-mono uppercase tracking-widest text-signal">
              № {String(edition.number).padStart(3, "0")}
            </span>
            <span className="text-muted-foreground">{date}</span>
          </div>

          <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">{edition.title}</h1>

          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">{edition.intro}</p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {edition.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-3xl px-5 py-16">
        <div className="flex flex-col gap-16">
          {edition.sections.map((sec, i) => (
            <section key={sec.key}>
              <div className="mb-6 flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="h-px flex-1 bg-border" />
                <h2 className="font-display text-2xl text-foreground">{sec.title}</h2>
              </div>

              {sec.body?.trim() ? (
                <p className="mb-8 text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {sec.body.trim()}
                </p>
              ) : null}

              <div className="flex flex-col divide-y divide-border/50">
                {sec.items.map((item) => (
                  <div key={item.id ?? item.title} className="py-6 first:pt-0">
                    <h3 className="font-display text-2xl leading-snug text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-foreground/80">{item.summary}</p>
                    {item.source ? (
                      item.url && item.url !== "#" ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-signal hover:underline"
                        >
                          {item.source} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
                          {item.source}
                        </span>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-signal/30 bg-card-gradient p-8 text-center shadow-glow">
          <h3 className="font-display text-2xl">Kapd meg a következő jelet a postaládádba.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Szerdánként 07:00 CET. Egy briefing. Nincs zaj.
          </p>
          <div className="mt-5 flex justify-center">
            <SubscribeForm compact />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
