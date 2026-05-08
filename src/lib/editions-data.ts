import type { Edition } from "@/lib/edition-types";
import { fetchPublishedEditionBySlug, fetchPublishedEditionsForArchive } from "@/lib/editions-repo";
import { editions as mockEditions } from "@/lib/mock-data";
import { useMockEditions } from "@/lib/public-env";

function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Publikus kiadások listája: mock (VITE_USE_MOCK_EDITIONS) vagy Supabase.
 * Ha nincs env, üres lista (empty state) — ne dobjon a főoldal hibát.
 */
export async function getPublicEditionsList(): Promise<Edition[]> {
  if (useMockEditions()) {
    return mockEditions;
  }
  if (!hasSupabaseEnv()) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        "[Budapest Signal] Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, or set VITE_USE_MOCK_EDITIONS=true for local demo.",
      );
    }
    return [];
  }
  try {
    return await fetchPublishedEditionsForArchive();
  } catch (e) {
    console.error("[Budapest Signal] getPublicEditionsList failed", e);
    return [];
  }
}

export async function getPublicEditionBySlug(slug: string): Promise<Edition | null> {
  if (useMockEditions()) {
    return mockEditions.find((e) => e.slug === slug) ?? null;
  }
  if (!hasSupabaseEnv()) {
    return null;
  }
  try {
    return await fetchPublishedEditionBySlug(slug);
  } catch (e) {
    console.error("[Budapest Signal] getPublicEditionBySlug failed", e);
    return null;
  }
}
