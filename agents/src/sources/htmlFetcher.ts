/**
 * Minimal HTML fetch helper for future non-RSS sources (Playwright later).
 * Returns raw body text for callers to parse.
 */
export async function fetchHtml(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": "BudapestSignalBot/1.0",
      Accept: "text/html,application/xhtml+xml",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`fetchHtml failed ${res.status} ${res.statusText}: ${url}`);
  }
  return res.text();
}
