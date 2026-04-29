import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Bot, Globe2, MapPin, Pencil } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Rólunk — Budapest Signal" },
      { name: "description", content: "Miért létezik a Budapest Signal, kik olvassák, és hogyan kuráljuk minden kiadást." },
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Rólunk</p>
          <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">
            Egy jel két időzónának — globális tech és helyi Budapest.
          </h1>
        </div>
      </section>

      <section className="border-b border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="prose prose-invert max-w-none">
            <p className="text-xl leading-relaxed text-foreground/90">
              A Budapest Signal azért létezik, mert az itt építő, befektető és operáló emberek megérdemlik, hogy egy briefing tisztelje az idejüket és a kontextusukat.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A legtöbb hírlevél vagy túl globális (modellbejelentések tűzfala helyi jelentés nélkül), vagy túl lokális (eseménylisták üzleti él nélkül). Mi mindkettőt csináljuk, egyszerre, minden szerdán.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A keverék: a globális MI- és tech-mozgások, amelyek megváltoztatják a roadmapedet, az eszközök, amelyek tényleg megérnek egy órát, a budapesti tech- és üzleti hírek, amelyek nem érnek el a timelineodig, és egy kurált hétvégi jel, hogy a szombatod ne egy újabb Google Maps-görgetés legyen.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Hogyan készül</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">Ember által kurálva, MI-vel támogatva.</h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Step icon={Globe2} title="Forrás" body="Ügynökeink folyamatosan figyelnek 60+ megbízható forrást a globális tech, a magyar sajtó, a VC-adatbázisok és a helyi kulturális kiadványok területén." />
            <Step icon={Bot} title="Pontozás" body="Minden tételt relevancia, újdonság és jel-zaj arány alapján pontozunk. A szemét még azelőtt kihullik, hogy ember látná." />
            <Step icon={Pencil} title="Szerkesztés" body="Egy szerkesztő átnézi a shortlistet, megírja minden sort, és kihúzza, ami nem érdemelné meg a helyét a postaládádban." />
            <Step icon={MapPin} title="Lokalizálás" body="A hétvégi jelet ténylegesen Budapesten élő emberek kurálják — nem turisztikai API-ból." />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">Olvasd a következő kiadást.</h2>
          <p className="mt-3 text-muted-foreground">Szerda, 07:00 CET. Egy briefing. Nincs zaj.</p>
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
