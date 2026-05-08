import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditionCard } from "@/components/EditionCard";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getPublicEditionsList } from "@/lib/editions-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/archive/")({
  loader: async () => {
    const editions = await getPublicEditionsList();
    return { editions };
  },
  head: () => ({
    meta: [
      { title: "Archívum — Budapest Signal" },
      {
        name: "description",
        content:
          "A Budapest Signal minden eddigi kiadása. Globális MI, helyi lépések, budapesti hétvégék.",
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  const { editions } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border/50 bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Archívum</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
            Minden jel, amit valaha küldtünk.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Böngéssz a korábbi kiadások között. Pótold, ami globálisan és helyben fontos volt — és
            hol volt Budapest azon a hétvégén.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          {editions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
              <p className="text-muted-foreground">
                Még nincs publikált kiadás. Ha draft van az adatbázisban, állítsd{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">published</code>{" "}
                státuszra, vagy használj mock adatot{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  VITE_USE_MOCK_EDITIONS=true
                </code>
                .
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/">Főoldal</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {editions.map((e) => (
                <EditionCard key={e.slug} edition={e} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">A következőt ne hagyd ki.</h2>
          <p className="mt-3 text-muted-foreground">
            Egy éles briefing. Minden szerdán 07:00 CET-kor.
          </p>
          <div className="mt-6 flex justify-center">
            <SubscribeForm compact />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
