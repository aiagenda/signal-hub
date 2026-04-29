import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditionCard } from "@/components/EditionCard";
import { SubscribeForm } from "@/components/SubscribeForm";
import { editions } from "@/lib/mock-data";

export const Route = createFileRoute("/archive/")({
  head: () => ({
    meta: [
      { title: "Archive — Budapest Signal" },
      { name: "description", content: "Every edition of Budapest Signal. Global AI, local moves, Budapest weekends." },
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Archive</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
            Every signal we've ever sent.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse past editions. Catch up on what mattered globally and locally — and where Budapest was that weekend.
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
          <h2 className="font-display text-3xl">Don't miss the next one.</h2>
          <p className="mt-3 text-muted-foreground">One sharp briefing. Every Wednesday at 07:00 CET.</p>
          <div className="mt-6 flex justify-center"><SubscribeForm compact /></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
