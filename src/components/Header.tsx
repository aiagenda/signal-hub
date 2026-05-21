import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

const eventSearch = { region: undefined, category: undefined, from: undefined } as const;

const links = [
  { to: "/archive" as const, label: "Archívum" },
  { to: "/advertise" as const, label: "Hirdetés" },
  { to: "/about" as const, label: "Rólunk" },
];

const navLinkCls =
  "rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-signal-muted hover:text-signal";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav className="hidden items-center gap-0.5 md:flex">
          <Link
            to="/events"
            search={eventSearch}
            className={navLinkCls}
            activeProps={{ className: "text-signal bg-signal-muted" }}
          >
            Események
          </Link>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={navLinkCls}
              activeProps={{ className: "text-signal bg-signal-muted" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild size="sm" variant="signal" className="rounded-full px-5">
            <Link to="/events/submit">+ Esemény beküldése</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-signal-muted hover:text-signal"
            aria-label="Menü"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            <Link
              to="/events"
              search={eventSearch}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-signal-muted hover:text-signal"
            >
              Események
            </Link>
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-signal-muted hover:text-signal"
              >
                {l.label}
              </Link>
            ))}
            <Button asChild size="sm" variant="signal" className="mt-2 rounded-full">
              <Link to="/events/submit" onClick={() => setOpen(false)}>
                + Esemény beküldése
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
