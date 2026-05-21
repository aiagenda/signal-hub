import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, MapPin, Tag, ChevronRight, Plus, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPublicEventsList } from "@/lib/events-data";
import { EVENT_CATEGORY_LABELS, HUNGARIAN_REGIONS, type EventCategory } from "@/lib/event-types";
import type { Event } from "@/lib/event-types";

export const Route = createFileRoute("/events/")({
  validateSearch: (s: Record<string, unknown>) => ({
    region: typeof s.region === "string" ? s.region : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    from: typeof s.from === "string" ? s.from : undefined,
  }),
  loaderDeps: ({ search }) => ({ ...search }),
  loader: async ({ deps }) => {
    const events = await getPublicEventsList({
      region: deps.region,
      category: deps.category,
      from: deps.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });
    return { events };
  },
  head: ({ loaderData }) => {
    const count = loaderData?.events.length ?? 0;
    return {
      meta: [
        { title: "Programok & Események — Magyarország" },
        {
          name: "description",
          content: `${count > 0 ? count + " közelgő esemény" : "Közelgő események"} Magyarország-szerte: bulik, fesztiválok, konferenciák, meetupok, koncertek és több.`,
        },
        { property: "og:title", content: "Programok & Események — Magyarország" },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: EventsIndexPage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "Időpont TBA";
  return new Date(iso).toLocaleDateString("hu-HU", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return "";
  return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
}

const CATEGORY_COLORS: Partial<Record<EventCategory, string>> = {
  buli: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  koncert: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  fesztival: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  konferencia: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  meetup: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  workshop: "bg-green-500/15 text-green-400 border-green-500/30",
  sport: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  kultura: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  gasztronomia: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  gyerek: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  egyeb: "bg-muted/40 text-muted-foreground border-border/60",
};

function CategoryBadge({ category }: { category: EventCategory | null }) {
  if (!category) return null;
  const cls = CATEGORY_COLORS[category] ?? "bg-muted/40 text-muted-foreground border-border/60";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}
    >
      <Tag className="h-2.5 w-2.5" />
      {EVENT_CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

function EventCard({ event }: { event: Event }) {
  const date = formatDate(event.startsAt);
  const time = formatTime(event.startsAt);

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm transition-all hover:border-signal/40 hover:bg-card/70 hover:shadow-md"
    >
      {event.coverImageUrl && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <CategoryBadge category={event.category} />
          {event.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 text-[11px] font-medium text-signal">
              <Star className="h-2.5 w-2.5" /> Kiemelt
            </span>
          )}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-signal" />
      </div>

      <h2 className="mt-3 font-display text-xl leading-snug text-foreground group-hover:text-signal transition-colors">
        {event.title}
      </h2>

      {event.summary && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.summary}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-signal/70" />
          {date}
          {time ? `, ${time}` : ""}
        </span>
        {(event.venue || event.city) && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-signal/70" />
            {[event.venue, event.city].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      {event.priceInfo && (
        <p className="mt-2 text-xs font-medium text-foreground/70">{event.priceInfo}</p>
      )}
    </Link>
  );
}

function EventsIndexPage() {
  const { events } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/events/" });
  const [localRegion, setLocalRegion] = useState(search.region ?? "");
  const [localCategory, setLocalCategory] = useState(search.category ?? "");

  function applyFilters() {
    void navigate({
      search: {
        region: localRegion || undefined,
        category: localCategory || undefined,
        from: search.from,
      },
    });
  }

  function clearFilters() {
    setLocalRegion("");
    setLocalCategory("");
    void navigate({ search: { region: undefined, category: undefined, from: undefined } });
  }

  const hasActiveFilter = search.region || search.category;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50 bg-hero-gradient grain">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Esemény-radar</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
            Programok Magyarország-szerte.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Bulik, fesztiválok, konferenciák, meetupok és minden más — egy helyen. Budapesttől a
            Balatonig, Békéscsabától Győrig.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/events/submit"
              className="inline-flex items-center gap-2 rounded-lg border border-signal/40 bg-signal/10 px-4 py-2 text-sm font-medium text-signal transition-colors hover:bg-signal/20"
            >
              <Plus className="h-4 w-4" /> Esemény beküldése
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={localRegion}
              onChange={(e) => setLocalRegion(e.target.value)}
              className="rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-signal/40"
            >
              <option value="">Összes régió</option>
              {HUNGARIAN_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              className="rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-signal/40"
            >
              <option value="">Összes kategória</option>
              {Object.entries(EVENT_CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>

            <button
              onClick={applyFilters}
              className="rounded-lg bg-signal px-4 py-1.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
            >
              Szűrés
            </button>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Törlés
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">{events.length} esemény</span>
          </div>
        </div>
      </section>

      {/* Active filter pills */}
      {hasActiveFilter && (
        <div className="border-b border-border/30 bg-signal/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-2 text-xs">
            <span className="text-muted-foreground">Szűrés:</span>
            {search.region && (
              <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 text-signal">
                {HUNGARIAN_REGIONS.find((r) => r.value === search.region)?.label ?? search.region}
              </span>
            )}
            {search.category && (
              <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 text-signal">
                {EVENT_CATEGORY_LABELS[search.category as EventCategory] ?? search.category}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Events grid */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-5">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-16 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-signal">
                Nincs találat
              </p>
              <h2 className="mt-3 font-display text-3xl">Nincs ilyen esemény.</h2>
              <p className="mt-3 text-muted-foreground">
                {hasActiveFilter
                  ? "Próbálj más szűrőkkel, vagy töröld a szűrőket."
                  : "Még nem kerültek be közelgő események az adatbázisba."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {hasActiveFilter && (
                  <button
                    onClick={clearFilters}
                    className="rounded-lg border border-border/60 px-4 py-2 text-sm hover:bg-muted"
                  >
                    Szűrők törlése
                  </button>
                )}
                <Link
                  to="/events/submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-signal/10 border border-signal/30 px-4 py-2 text-sm text-signal"
                >
                  <Plus className="h-4 w-4" /> Esemény beküldése
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA beküldés */}
      <section className="border-t border-border/50 py-14">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Szervező vagy?</p>
          <h2 className="mt-3 font-display text-3xl">Küldd be az eseményedet.</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Ingyenesen listázzuk. Konferencia, buli, fesztivál, meetup — minden típus jöhet.
          </p>
          <div className="mt-6">
            <Link
              to="/events/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3 font-medium text-signal-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Esemény beküldése
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
