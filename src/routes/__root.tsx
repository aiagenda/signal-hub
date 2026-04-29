import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Budapest Signal — Global AI. Local moves. Budapest weekends." },
      { name: "description", content: "A weekly briefing on global AI, the tools that matter, Budapest tech & business, and the weekend picks worth your time." },
      { name: "author", content: "Budapest Signal" },
      { property: "og:title", content: "Budapest Signal" },
      { property: "og:description", content: "Global AI. Local moves. Budapest weekends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
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
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">404 · no signal</p>
        <h1 className="mt-3 font-display text-5xl">Lost the frequency.</h1>
        <p className="mt-3 text-muted-foreground">This page isn't part of any edition.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-signal-gradient px-4 py-2 text-sm font-medium text-signal-foreground">
          Back to home
        </a>
      </div>
    </div>
  );
}
