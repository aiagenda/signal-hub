import Parser from "rss-parser";
import { log } from "../utils/logger.js";

export type NormalizedFeedItem = {
  title: string;
  link: string;
  isoDate: string | null;
  guid: string | null;
  excerpt: string | null;
};

const parser = new Parser({
  timeout: 25_000,
  headers: {
    "User-Agent": "BudapestSignalBot/1.0 (+https://budapest-signal.local)",
  },
});

export async function fetchRssFeed(feedUrl: string): Promise<NormalizedFeedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: NormalizedFeedItem[] = [];
  for (const entry of feed.items ?? []) {
    const link = entry.link?.trim();
    const title = entry.title?.trim();
    if (!link || !title) continue;

    const pub = entry.isoDate ?? entry.pubDate ?? null;
    let isoDate: string | null = null;
    if (pub) {
      const d = new Date(pub);
      isoDate = Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    const guid =
      typeof entry.guid === "string"
        ? entry.guid.trim()
        : entry.guid && typeof entry.guid === "object" && "value" in entry.guid
          ? String((entry.guid as { value?: string }).value ?? "").trim()
          : null;

    const excerpt =
      entry.contentSnippet?.trim() ??
      (typeof entry.content === "string" ? entry.content.slice(0, 500) : null);

    items.push({
      title,
      link,
      isoDate,
      guid: guid || null,
      excerpt: excerpt || null,
    });
  }

  log.debug("rss_fetch_parsed", { feedUrl, count: items.length });
  return items;
}
