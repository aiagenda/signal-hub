import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Tag, ChevronRight, Star } from "lucide-react";
import { EVENT_CATEGORY_LABELS, type Event, type EventCategory } from "@/lib/event-types";

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
  if (d.getHours() === 0 && d.getMinutes() === 0) return "";
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

export function CategoryBadge({ category }: { category: EventCategory | null }) {
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

export function EventCard({ event }: { event: Event }) {
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

      <h2 className="mt-3 font-display text-xl leading-snug text-foreground transition-colors group-hover:text-signal">
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
