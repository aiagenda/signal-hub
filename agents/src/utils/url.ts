/**
 * Normalizes a URL for stable deduplication (hash is SHA-256 of this string).
 */
export function normalizeCanonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    return u.href;
  } catch {
    return raw.trim();
  }
}
