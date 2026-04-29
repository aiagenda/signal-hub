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
      { title: "Budapest Signal — Globális MI. Helyi lépések. Budapesti hétvégék." },
      { name: "description", content: "Heti jel azoknak, akik globálisan akarnak előrébb járni és helyben okosabban lépni." },
    ],
  }),
  component: Home,
});

const sections = [
  { icon: Globe2, label: "01", title: "Globális MI jel", description: "A hét legfontosabb modell-, szabályozási és platform-mozgásai — leszűrve arra, ami megváltoztatja a roadmapedet." },
  { icon: Wrench, label: "02", title: "Eszköz-radar", description: "Az éppen érkező eszközök, amelyek tényleg megérnek egy értékelési órát." },
  { icon: Lightbulb, label: "03", title: "Építő-szemszög", description: "Egy rövid, véleményes elemzés CEE-ben építő operátoroktól — árazás, toborzás, GTM." },
  { icon: Building2, label: "04", title: "Budapesti tech & üzlet", description: "Finanszírozási körök, kinevezések, nyitások és csendes lépések, amiket nem fogsz elcsípni a timelineodon." },
  { icon: MapPin, label: "05", title: "Hétvégi jel", description: "Kurált tippek Budapest és Pest megye területéről. Hová érdemes ténylegesen elmenni." },
  { icon: Sparkles, label: "06", title: "Kiemelt partnerek", description: "Pár cég, amiben bízunk — szerkesztői tisztelettel bemutatva, sosem szponzorált zaj." },
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
            <span>Megjelent a № {String(featured.number).padStart(3, "0")}. kiadás</span>
          </div>

          <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
            Globális MI.{" "}
            <span className="text-muted-foreground">Helyi lépések.</span>{" "}
            <span className="text-gradient-signal">Budapesti hétvégék.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Heti jel azoknak, akik globálisan akarnak előrébb járni és helyben okosabban lépni — MI, tech, üzlet, események és kurált hétvégi tippek Budapestről és környékéről.
          </p>

          <div className="mt-9">
            <SubscribeForm />
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <Stat value="8 420" label="Olvasó" />
            <Stat value="62%" label="Megnyitási arány" />
            <Stat value="Sze 07:00" label="A postaládádban" />
            <Stat value="Budapest" label="Innen kuráljuk" />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Header2 eyebrow="Mit kapsz" title="Hat jel. Egy éles briefing." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => <SectionCard key={s.title} {...s} />)}
          </div>
        </div>
      </section>

      {/* LATEST EDITION */}
      <section className="border-b border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Header2 eyebrow="Legfrissebb kiadás" title="Egy pillantás erre a hétre." />
            <Button asChild variant="outline">
              <Link to="/archive/$slug" params={{ slug: featured.slug }}>
                Teljes kiadás <ArrowRight className="ml-1 h-4 w-4" />
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Kiknek</p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            Alapítók, építők, marketingesek, alkotók, expatok és a
            <span className="text-muted-foreground"> kíváncsi emberek, </span>
            akik Budapestet alakítják.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {["Alapítók", "Mérnökök", "Termékmenedzserek", "Marketingesek", "Designerek", "Befektetők", "Expatok", "Kurátorok", "Operátorok"].map((t) => (
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
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Partnereknek</p>
                <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                  Érd el Budapest MI-, tech- és üzleti közönségét.
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground">
                  Natív, szerkesztői színvonalú elhelyezések egy briefingben, amit az emberek tényleg megnyitnak. Nincs banner, nincs csalogató — csak tisztelet az olvasó és a márkád iránt.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Button asChild size="lg" variant="signal">
                  <Link to="/advertise">Hirdess nálunk <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
