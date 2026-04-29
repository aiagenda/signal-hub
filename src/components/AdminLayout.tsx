import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Database, FileText, Hammer, Megaphone, Activity, ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const items = [
  { to: "/admin", label: "Áttekintés", icon: LayoutDashboard, exact: true },
  { to: "/admin/sources", label: "Források", icon: Database },
  { to: "/admin/content", label: "Tartalmak", icon: FileText },
  { to: "/admin/edition-builder", label: "Kiadás-szerkesztő", icon: Hammer },
  { to: "/admin/sponsors", label: "Szponzorok", icon: Megaphone },
  { to: "/admin/agent-runs", label: "Ügynök-futások", icon: Activity },
];

export function AdminLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur md:flex">
        <div className="border-b border-border/50 p-5"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-signal-muted text-signal"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/50 p-3 flex items-center justify-between gap-2">
          <Link to="/" className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Vissza az oldalra
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-border/50 bg-background/60 backdrop-blur">
          <div className="px-6 py-7 md:px-10 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Admin</p>
              <h1 className="mt-2 font-display text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="md:hidden"><ThemeToggle /></div>
          </div>
        </div>
        <div className="px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
