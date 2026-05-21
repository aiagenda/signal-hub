import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, ExternalLink, ArrowLeft, Tag, Clock, User } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPublicEventBySlug } from "@/lib/events-data";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/lib/event-types";
import { getPublicSiteUrl } from "@/lib/public-env";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const event = await getPublicEventBySlug(params.slug);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const { event } = loaderData;
    const canonical = `${getPublicSiteUrl()}/events/${event.slug}`;
    const desc = event.summary ?? event.title;
    const dateStr = event.startsAt
      ? new Date(event.startsAt).toLocaleDateString("hu-HU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    const fullTitle = `${event.title}${dateStr ? ` — ${dateStr}` : ""}`;
    return {
      meta: [
        { title: `${fullTitle}` },
        { name: "description", content: desc },
        { property: "og:title", content: fullTitle },
        { property: "og:description", content: desc },
        { property: "og:type", content: "event" },
        { property: "og:url", content: canonical },
        ...(event.coverImageUrl ? [{ property: "og:image", content: event.coverImageUrl }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: EventDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">404</p>
        <h1 className="mt-3 font-display text-4xl">Esemény nem található.</h1>
        <Link to="/events" search={{ region: undefined, category: undefined, from: undefined }} className="mt-6 inline-block text-sm text-signal hover:underline">
          ← Vissza az eseményekhez
        </Link>
      </div>
    </div>
  ),
});

function formatFullDate(iso: string | null): string {
  if (!iso) return "Időpont TBA";
  return new Date(iso).toLocaleDateString("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleDateString("hu-HU", {
    month: "short",
    day: "numeric",
  });
}

function EventDetailPage() {
  const { event } = Route.useLoaderData();
  const categoryLabel = event.category
    ? (EVENT_CATEGORY_LABELS[event.category as EventCategory] ?? event.category)
    : null;

  const isPast = event.startsAt ? new Date(event.startsAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover image */}
      {event.coverImageUrl && (
        <div className="relative h-64 w-full overflow-hidden md:h-80">
          <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 py-12">
        {/* Breadcrumb */}
        <Link
          to="/events"
          search={{ region: undefined, category: undefined, from: undefined }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Összes esemény
        </Link>

        {/* Category + past badge */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {categoryLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Tag className="h-3 w-3" /> {categoryLabel}
            </span>
          )}
          {isPast && (
            <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
              Lezajlott esemény
            </span>
          )}
          {event.isFeatured && (
            <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-medium text-signal">
              ★ Kiemelt
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">{event.title}</h1>

        {/* Meta info */}
        <div className="mt-6 grid gap-3 rounded-2xl border border-border/60 bg-card/40 p-5 sm:grid-cols-2">
          {event.startsAt && (
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kezdés
                </p>
                <p className="mt-0.5 text-sm font-medium">{formatFullDate(event.startsAt)}</p>
              </div>
            </div>
          )}

          {event.endsAt && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Befejezés
                </p>
                <p className="mt-0.5 text-sm font-medium">{formatShortDate(event.endsAt)}</p>
              </div>
            </div>
          )}

          {(event.venue || event.city) && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Helyszín
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {[event.venue, event.city].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {event.organizerName && (
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Szervező
                </p>
                <p className="mt-0.5 text-sm font-medium">{event.organizerName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {event.priceInfo && (
            <p className="text-sm font-medium text-foreground/80">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
                Ár:
              </span>
              {event.priceInfo}
            </p>
          )}
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 text-sm font-medium text-signal-foreground transition-opacity hover:opacity-90"
            >
              Jegy / Regisztráció <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {event.sourceUrl && !event.ticketUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Forrás megtekintése <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Summary / description */}
        {event.summary && (
          <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none">
            {event.summary.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="my-4 leading-relaxed text-foreground/90">
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-14 border-t border-border/50 pt-8">
          <Link
            to="/events"
            search={{ region: undefined, category: undefined, from: undefined }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Összes esemény
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
