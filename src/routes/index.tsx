import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { SectionCard } from "@/components/SectionCard";
import { editions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Globe2, Wrench, Lightbulb, Building2, MapPin, Sparkles,
  ArrowRight, Radio,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Budapest Signal — Global AI. Local moves. Budapest weekends." },
      { name: "description", content: "A weekly signal for people who want to stay ahead globally and move smarter locally." },
    ],
  }),
  component: Home,
});

const sections = [
  { icon: Globe2, label: "01", title: "Global AI Signal", description: "The week's most important model, policy and platform moves — distilled to what changes your roadmap." },
  { icon: Wrench, label: "02", title: "Tool Radar", description: "The tools shipping right now that are actually worth your evaluation hour." },
  { icon: Lightbulb, label: "03", title: "Builder Angle", description: "A short, opinionated take from operators building in CEE — pricing, hiring, GTM." },
  { icon: Building2, label: "04", title: "Budapest Tech & Business", description: "Funding rounds, hires, openings and quiet moves you won't catch on your timeline." },
  { icon: MapPin, label: "05", title: "Weekend Signal", description: "Curated picks across Budapest and Pest county. Where to actually go, not what tops a list." },
  { icon: Sparkles, label: "06", title: "Featured Partners", description: "A handful of companies we trust, presented with editorial respect — never sponsored noise." },
];

function Home() {
  const featured = editions[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section id="subscribe" className="relative overflow-hidden border-b border-border/50 bg-hero-gradient grain">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Radio className="h-3 w-3 text-signal animate-pulse-signal" />
            <span>Edition № {String(featured.number).padStart(3, "0")} just shipped</span>
          </div>

          <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
            Global AI.{" "}
            <span className="text-muted-foreground">Local moves.</span>{" "}
            <span className="text-gradient-signal">Budapest weekends.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            A weekly signal for people who want to stay ahead globally and move smarter locally — AI, tech, business, events and curated weekend picks from Budapest and beyond.
          </p>

          <div className="mt-9">
            <SubscribeForm />
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <Stat value="8,420" label="Readers" />
            <Stat value="62%" label="Open rate" />
            <Stat value="Wed 07:00" label="In your inbox" />
            <Stat value="Budapest" label="Curated from" />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Header2 eyebrow="What you get" title="Six signals. One sharp briefing." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => <SectionCard key={s.title} {...s} />)}
          </div>
        </div>
      </section>

      {/* LATEST EDITION */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Header2 eyebrow="Latest edition" title="A look inside this week." />
            <Button asChild variant="outline">
              <Link to="/archive/$slug" params={{ slug: featured.slug }}>
                Read the full edition <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featured.sections.slice(0, 4).map((sec) => (
              <div key={sec.key} className="rounded-2xl border border-border/60 bg-card-gradient p-7 shadow-card">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-signal">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  {sec.title}
                </div>
                <ul className="mt-5 flex flex-col divide-y divide-border/50">
                  {sec.items.slice(0, 2).map((item) => (
                    <li key={item.title} className="py-3 first:pt-0 last:pb-0">
                      <div className="font-display text-lg leading-snug text-foreground">{item.title}</div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Built for</p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            Founders, builders, marketers, creators, expats and the
            <span className="text-muted-foreground"> curious people </span>
            shaping Budapest.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {["Founders", "Engineers", "PMs", "Marketers", "Designers", "Investors", "Expats", "Curators", "Operators"].map((t) => (
              <span key={t} className="rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-sm text-foreground/80 backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SPONSOR */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="relative overflow-hidden rounded-3xl border border-signal/30 bg-card-gradient p-10 shadow-glow md:p-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">For partners</p>
                <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  Reach Budapest's AI, tech and business-minded audience.
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground">
                  Native, editorial-grade placements inside a briefing people actually open. No banners, no bait — just respect for the reader and your brand.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Button asChild size="lg" variant="signal">
                  <Link to="/advertise">Advertise with us <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-lg text-foreground">{value}</span>
      <span className="uppercase tracking-widest">{label}</span>
    </div>
  );
}

function Header2({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{title}</h2>
    </div>
  );
}
