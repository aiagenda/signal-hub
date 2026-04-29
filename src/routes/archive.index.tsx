import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditionCard } from "@/components/EditionCard";
import { SubscribeForm } from "@/components/SubscribeForm";
import { editions } from "@/lib/mock-data";

export const Route = createFileRoute("/archive/")({
  head: () => ({
    meta: [
      { title: "Archívum — Budapest Signal" },
      { name: "description", content: "A Budapest Signal minden eddigi kiadása. Globális MI, helyi lépések, budapesti hétvégék." },
    ],
  }),
  component: Archive,
});

function Archive() {
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
            Böngéssz a korábbi kiadások között. Pótold, ami globálisan és helyben fontos volt — és hol volt Budapest azon a hétvégén.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-6 md:grid-cols-2">
            {editions.map((e) => <EditionCard key={e.slug} edition={e} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">A következőt ne hagyd ki.</h2>
          <p className="mt-3 text-muted-foreground">Egy éles briefing. Minden szerdán 07:00 CET-kor.</p>
          <div className="mt-6 flex justify-center"><SubscribeForm compact /></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
