import { createFileRoute } from "@tanstack/react-router";
import { fetchPublishedEditionSlugs } from "@/lib/editions-repo";
import { fetchPublishedArticleSlugs } from "@/lib/articles-repo";
import { buildSitemapXml } from "@/lib/sitemap-xml";
import { getPublicSiteUrl } from "@/lib/public-env";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const base = getPublicSiteUrl();
        const entries: { loc: string; lastmod?: string }[] = [
          { loc: `${base}/`, lastmod: new Date().toISOString().slice(0, 10) },
          { loc: `${base}/archive`, lastmod: new Date().toISOString().slice(0, 10) },
          { loc: `${base}/about`, lastmod: new Date().toISOString().slice(0, 10) },
          { loc: `${base}/advertise`, lastmod: new Date().toISOString().slice(0, 10) },
        ];

        try {
          const eds = await fetchPublishedEditionSlugs();
          for (const e of eds) {
            const lm = e.published_at
              ? new Date(e.published_at).toISOString().slice(0, 10)
              : undefined;
            entries.push({
              loc: `${base}/archive/${e.slug}`,
              lastmod: lm,
            });
          }
          const arts = await fetchPublishedArticleSlugs();
          for (const a of arts) {
            const lm = a.published_at
              ? new Date(a.published_at).toISOString().slice(0, 10)
              : undefined;
            entries.push({
              loc: `${base}/articles/${a.slug}`,
              lastmod: lm,
            });
          }
        } catch {
          /* Supabase env missing or query failed — static URLs only */
        }

        const xml = buildSitemapXml(entries);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
