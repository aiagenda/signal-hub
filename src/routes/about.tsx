import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Bot, Globe2, MapPin, Pencil } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Budapest Signal" },
      { name: "description", content: "Why Budapest Signal exists, who reads it, and how we curate every edition." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-5 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">About</p>
          <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">
            One signal for two timezones — global tech and local Budapest.
          </h1>
        </div>
      </section>

      <section className="border-b border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="prose prose-invert max-w-none">
            <p className="text-xl leading-relaxed text-foreground/90">
              Budapest Signal exists because the people building, investing and operating in this city deserve a briefing that respects their time and their context.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Most newsletters are either too global (a firehose of model releases with no local meaning) or too local (events listings with no business edge). We do both, in one pass, every Wednesday.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              The mix: the global AI and tech moves that change your roadmap, the tools that are actually worth your evaluation hour, the Budapest tech & business news that won't reach your timeline, and a curated weekend signal so your Saturday isn't another scroll through Google Maps.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">How we make it</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">Human-curated, AI-assisted.</h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Step icon={Globe2} title="Source" body="Our agents continuously crawl 60+ trusted sources across global tech, Hungarian press, VC databases and local culture publications." />
            <Step icon={Bot} title="Score" body="Every item is scored for relevance, novelty and signal-to-noise. Junk is dropped before a human ever sees it." />
            <Step icon={Pencil} title="Edit" body="An editor reviews the shortlist, writes every line, and kills anything that wouldn't earn its place in your inbox." />
            <Step icon={MapPin} title="Localize" body="The weekend signal is curated by people actually living in Budapest — not pulled from a tourism API." />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">Read the next edition.</h2>
          <p className="mt-3 text-muted-foreground">Wednesday, 07:00 CET. One briefing. No noise.</p>
          <div className="mt-6 flex justify-center"><SubscribeForm compact /></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Step({ icon: Icon, title, body }: { icon: typeof Globe2; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card-gradient p-7 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal-muted text-signal">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
