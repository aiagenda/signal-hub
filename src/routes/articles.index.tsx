import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublicArticlesList } from "@/lib/articles-data";
import { Button } from "@/components/ui/button";

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const Route = createFileRoute("/articles/")({
  loader: async () => {
    const articles = await getPublicArticlesList();
    return { articles };
  },
  head: () => ({
    meta: [
      { title: "Cikkek — Budapest Signal" },
      {
        name: "description",
        content:
          "Hosszu formaju Budapest Signal cikkek: trendek, elemzesek es gyakorlati takeaways alapitoi es operativ csapatoknak.",
      },
    ],
  }),
  component: ArticlesIndexPage,
});

function ArticlesIndexPage() {
  const { articles } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Cikkek</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
            Melyfuras: mi mozgatja most a piacot?
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Hosszu formaju, szerkesztett anyagok kulfoldi trendekrol, budapesti hatasokrol es konkret
            kovetkezo lepesekrol.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
              <p className="text-muted-foreground">
                Meg nincs publikalt cikk az <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">articles</code>{" "}
                tablaban.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/">Fooldal</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card"
                >
                  <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
                    {formatDate(article.publishedAt ?? article.createdAt)}
                  </p>
                  <h2 className="mt-2 font-display text-3xl">
                    <Link to="/articles/$slug" params={{ slug: article.slug }} className="hover:underline">
                      {article.title}
                    </Link>
                  </h2>
                  {article.excerpt ? <p className="mt-3 text-muted-foreground">{article.excerpt}</p> : null}
                  {article.keywords.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {article.keywords.slice(0, 6).map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">Koveto briefing minden heten.</h2>
          <p className="mt-3 text-muted-foreground">Szerdan 07:00 CET. Egy level. Nulla zaj.</p>
          <div className="mt-6 flex justify-center">
            <SubscribeForm compact />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
