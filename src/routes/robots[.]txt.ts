import { createFileRoute } from "@tanstack/react-router";
import { getPublicSiteUrl } from "@/lib/public-env";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const base = getPublicSiteUrl();
        const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
