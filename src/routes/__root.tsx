import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { Toaster } from "@/components/ui/sonner";
import { getOgImageAbsoluteUrl, getPublicSiteUrl } from "@/lib/public-env";

const themeInitScript = `(function(){try{var t=localStorage.getItem('bps-theme');if(!t){t='dark';}if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

const ogImage = getOgImageAbsoluteUrl();
const siteUrl = getPublicSiteUrl();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Budapest Signal — Globális MI. Helyi lépések. Budapesti hétvégék." },
      {
        name: "description",
        content:
          "Heti hírlevél a globális MI-ről, a fontos eszközökről, a budapesti tech- és üzleti hírekről, és a hétvége legjobb programjairól.",
      },
      { name: "author", content: "Budapest Signal" },
      { property: "og:title", content: "Budapest Signal" },
      { property: "og:description", content: "Globális MI. Helyi lépések. Budapesti hétvégék." },
      { property: "og:locale", content: "hu_HU" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: siteUrl },
    ],
    scripts: [{ children: themeInitScript }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    // Theme script (head) toggles `dark` on <html> before hydration — suppress mismatch warning.
    <html lang="hu" suppressHydrationWarning>
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-center" />
        <AnalyticsScripts />
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">404 · nincs jel</p>
        <h1 className="mt-3 font-display text-5xl">Elveszett a frekvencia.</h1>
        <p className="mt-3 text-muted-foreground">Ez az oldal nem szerepel egyik kiadásban sem.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-signal-gradient px-4 py-2 text-sm font-medium text-signal-foreground"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  );
}
