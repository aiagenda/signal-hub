import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, Plus, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventCard, CategoryBadge } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { getPublicEventsList } from "@/lib/events-data";
import { EVENT_CATEGORIES, HUNGARIAN_REGIONS } from "@/lib/event-types";

export const Route = createFileRoute("/")({
  loader: async () => {
    const events = await getPublicEventsList({
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });
    return { events, preview: events.slice(0, 12) };
  },
  head: ({ loaderData }) => {
    const count = loaderData?.events.length ?? 0;
    return {
      meta: [
        { title: "Programradar — Események Magyarország-szerte" },
        {
          name: "description",
          content: `${count > 0 ? count + " közelgő esemény" : "Közelgő események"} országszerte: bulik, fesztiválok, konferenciák, meetupok, koncertek és több.`,
        },
        { property: "og:title", content: "Programradar — Események Magyarország-szerte" },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: Home,
});

const eventSearch = { region: undefined, category: undefined, from: undefined } as const;

function Home() {
  const { events, preview } = Route.useLoaderData();

  const cities = [...new Set(events.map((e) => e.city).filter(Boolean))].slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden border-b border-border/50 bg-hero-gradient grain">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-signal" />
            <span>
              {events.length > 0
                ? `${events.length} közelgő esemény országszerte`
                : "Esemény-radar — hamarosan több program"}
            </span>
          </div>

          <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[1.02] tracking-tight md:text-7xl">
            Mi történik <span className="text-gradient-signal">Magyarországon?</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Bulik, fesztiválok, konferenciák, meetupok és minden más — egy helyen. Budapesttől a
            Balatonig, Debrecenig, Békéscsabáig.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="signal">
              <Link to="/events" search={eventSearch}>
                Összes esemény <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/events/submit">
                <Plus className="mr-1 h-4 w-4" /> Esemény beküldése
              </Link>
            </Button>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <Stat value={String(events.length)} label="Közelgő esemény" />
            <Stat value={String(HUNGARIAN_REGIONS.length - 1)} label="Régió" />
            <Stat value={String(EVENT_CATEGORIES.length)} label="Kategória" />
            <Stat value="Országos" label="Lefedettség" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Közelgő</p>
              <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                Friss programok
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/events" search={eventSearch}>
                Teljes lista <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {preview.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Még nincs publikált közelgő esemény. Küldd be a sajátodat!
              </p>
              <Button asChild className="mt-6" variant="signal">
                <Link to="/events/submit">Esemény beküldése</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Kategóriák</p>
          <h2 className="mt-3 font-display text-3xl">Mit keresel?</h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to="/events"
                search={{ ...eventSearch, category: cat }}
                className="transition-transform hover:scale-105"
              >
                <CategoryBadge category={cat} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Régiók</p>
          <h2 className="mt-3 font-display text-3xl">Hol történik?</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {HUNGARIAN_REGIONS.filter((r) => r.value !== "egyeb").map((r) => (
              <Link
                key={r.value}
                to="/events"
                search={{ ...eventSearch, region: r.value }}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm transition-colors hover:border-signal/40 hover:bg-card/70"
              >
                <MapPin className="h-4 w-4 shrink-0 text-signal/70" />
                {r.label}
              </Link>
            ))}
          </div>
          {cities.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Közelgő városok: {cities.join(" · ")}
            </p>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Szervező vagy?</p>
          <h2 className="mt-3 font-display text-4xl">Küldd be az eseményedet — ingyen.</h2>
          <p className="mt-4 text-muted-foreground">
            Konferencia, buli, fesztivál, meetup, workshop — minden típus jöhet. Moderálás után
            kerül fel az oldalra.
          </p>
          <Button asChild size="lg" variant="signal" className="mt-8">
            <Link to="/events/submit">
              <Plus className="mr-1 h-4 w-4" /> Esemény beküldése
            </Link>
          </Button>
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
