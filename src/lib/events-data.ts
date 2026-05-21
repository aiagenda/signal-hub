import type { Event } from "@/lib/event-types";
import type { EventsFilter } from "@/lib/events-repo";
import {
  fetchPublishedEvents,
  fetchPublishedEventBySlug,
  fetchUpcomingFeaturedEvents,
} from "@/lib/events-repo";

function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function getPublicEventsList(filter: EventsFilter = {}): Promise<Event[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    return await fetchPublishedEvents(filter);
  } catch (e) {
    console.error("[Signal] getPublicEventsList failed", e);
    return [];
  }
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    return await fetchPublishedEventBySlug(slug);
  } catch (e) {
    console.error("[Signal] getPublicEventBySlug failed", e);
    return null;
  }
}

export async function getFeaturedEvents(limit = 6): Promise<Event[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    return await fetchUpcomingFeaturedEvents(limit);
  } catch (e) {
    console.error("[Signal] getFeaturedEvents failed", e);
    return [];
  }
}
