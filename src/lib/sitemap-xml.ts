function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemapXml(entries: { loc: string; lastmod?: string }[]): string {
  const rows = entries
    .map((e) => {
      const lm = e.lastmod ? `\n    <lastmod>${escapeXml(e.lastmod)}</lastmod>` : "";
      return `  <url>
    <loc>${escapeXml(e.loc)}</loc>${lm}
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>`;
}
