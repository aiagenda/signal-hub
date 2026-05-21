import { getSupabaseAnonClient } from "@/lib/supabase-browser";
import type { Event, EventCategory } from "@/lib/event-types";

type DbEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  city: string | null;
  region: string | null;
  country: string;
  price_info: string | null;
  ticket_url: string | null;
  cover_image_url: string | null;
  organizer_name: string | null;
  category: string | null;
  tags: string[] | null;
  is_featured: boolean;
  source_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
};

function mapDbEvent(row: DbEventRow): Event {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.title,
    summary: row.summary,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venue: row.venue,
    city: row.city,
    region: row.region,
    country: row.country ?? "HU",
    priceInfo: row.price_info,
    ticketUrl: row.ticket_url,
    coverImageUrl: row.cover_image_url,
    organizerName: row.organizer_name,
    category: (row.category as EventCategory) ?? null,
    tags: row.tags ?? [],
    isFeatured: row.is_featured ?? false,
    sourceUrl: row.source_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

const eventSelect = `
  id, slug, title, summary, starts_at, ends_at,
  venue, city, region, country,
  price_info, ticket_url, cover_image_url, organizer_name,
  category, tags, is_featured, source_url, status, created_at
`;

export type EventsFilter = {
  region?: string;
  category?: string;
  from?: string;
  to?: string;
  featured?: boolean;
};

export async function fetchPublishedEvents(filter: EventsFilter = {}): Promise<Event[]> {
  const supabase = getSupabaseAnonClient();
  let query = supabase
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(120);

  if (filter.region) query = query.eq("region", filter.region);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.from) query = query.gte("starts_at", filter.from);
  if (filter.to) query = query.lte("starts_at", filter.to);
  if (filter.featured) query = query.eq("is_featured", true);

  const { data, error } = await query;
  if (error) {
    console.error("fetchPublishedEvents", error.message);
    throw new Error(error.message);
  }
  return (data as DbEventRow[]).map(mapDbEvent);
}

export async function fetchPublishedEventBySlug(slug: string): Promise<Event | null> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("fetchPublishedEventBySlug", error.message);
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapDbEvent(data as DbEventRow);
}

export async function fetchUpcomingFeaturedEvents(limit = 6): Promise<Event[]> {
  const supabase = getSupabaseAnonClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .eq("is_featured", true)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("fetchUpcomingFeaturedEvents", error.message);
    return [];
  }
  return (data as DbEventRow[]).map(mapDbEvent);
}

export async function submitEvent(payload: {
  title: string;
  startsAt: string;
  endsAt?: string;
  venue?: string;
  city: string;
  region?: string;
  priceInfo?: string;
  ticketUrl?: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  category?: string;
  tags?: string[];
}): Promise<void> {
  const supabase = getSupabaseAnonClient();
  const { error } = await supabase.from("event_submissions").insert({
    title: payload.title,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt ?? null,
    venue: payload.venue ?? null,
    city: payload.city,
    region: payload.region ?? null,
    price_info: payload.priceInfo ?? null,
    ticket_url: payload.ticketUrl ?? null,
    description: payload.description ?? null,
    organizer_name: payload.organizerName,
    organizer_email: payload.organizerEmail,
    category: payload.category ?? null,
    tags: payload.tags ?? [],
  });
  if (error) throw new Error(error.message);
}
