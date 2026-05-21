import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Bot, Globe2, MapPin, Pencil } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Rólunk — Happn" },
      {
        name: "description",
        content:
          "Miért létezik a Happn, kik használják, és hogyan gyűjtjük össze Magyarország legjobb programjait.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/40 bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-5 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Rólunk</p>
          <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">
            A <span className="text-gradient-signal">Happn</span> egy levél Magyarországnak.
          </h1>
        </div>
      </section>

      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="prose prose-invert max-w-none">
            <p className="text-xl leading-relaxed text-foreground/90">
              Hiszünk benne, hogy az igazi élmények nem egy algoritmus mélyén kezdődnek, hanem egy
              koncert első akkordján, egy meetup első kézfogásánál, egy fesztivál hajnali fényeinél.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A Happn azért született, hogy soha többé ne kelljen tíz csoportot, hét hírlevelet és
              három plakátoszlopot böngészned ahhoz, hogy megtudd, mi történik körülötted.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Egy hely. Egy ország. Minden este.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Hogyan működik</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">
            Ember által kurálva, MI-vel támogatva.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Step
              icon={Globe2}
              title="Gyűjtés"
              body="Ügynökeink folyamatosan figyelik az eseményszervező oldalakat, Facebook-csoportokat, helyi kiadványokat és RSS forrásokat szerte az országban."
            />
            <Step
              icon={Bot}
              title="Feldolgozás"
              body="Minden beérkező programot relevancia és minőség alapján szűrünk. A duplikátumok és az alacsony minőségű tartalom még azelőtt kiszűrésre kerül, hogy ember látná."
            />
            <Step
              icon={Pencil}
              title="Moderálás"
              body="Egy szerkesztő átnézi a shortlistet, szerkeszti a leírásokat, és csak a valóban érdekes programok kerülnek fel az oldalra."
            />
            <Step
              icon={MapPin}
              title="Lokalizálás"
              body="Nemcsak Budapest — Debrecen, Pécs, Győr, Miskolc, Balaton. Minden program ott jelenik meg, ahol valójában történik."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border/40 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Adat & mérés</p>
          <h2 className="mt-3 font-display text-3xl leading-tight md:text-4xl">
            Feliratkozás és opcionális analitika.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A feliratkozási e-mail címet biztonságosan tároljuk, hogy el tudjuk küldeni a heti
            programösszefoglalót. Opcionálisan bekapcsolhatsz Plausible vagy Google Analytics 4
            mérést — ezek cookie-light beállítással illeszkednek a GDPR elvárásokhoz.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl">Ne maradj le semmiről.</h2>
          <p className="mt-3 text-muted-foreground">
            Heti egy összefoglaló a legjobb közelgő programokról. Spam nélkül.
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

function Step({ icon: Icon, title, body }: { icon: typeof Globe2; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card-gradient p-7 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-muted text-signal">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
