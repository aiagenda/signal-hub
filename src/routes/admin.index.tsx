import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, FileEdit, Inbox, Megaphone, Activity } from "lucide-react";
import { metrics, agentRuns, contentItems } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin áttekintés — Budapest Signal" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <AdminLayout title="Áttekintés" subtitle="A jel egy pillantásra.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={Users} label="Feliratkozók" value={metrics.subscribers.toLocaleString("hu-HU")} hint={metrics.subscribersDelta} />
        <MetricCard icon={FileEdit} label="Vázlat kiadások" value={metrics.draftEditions} hint="№ 025. kiadás" />
        <MetricCard icon={Inbox} label="Függő tételek" value={metrics.pendingItems} hint="Ellenőrzésre vár" />
        <MetricCard icon={Megaphone} label="Szponzor érdeklődők" value={metrics.sponsorLeads} hint="Új ezen a héten" />
        <MetricCard icon={Activity} label="Ügynök-futások" value={metrics.agentRuns} hint="Utolsó 24 óra" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Legutóbbi ügynök-futások</h2>
            <span className="text-xs text-muted-foreground">Élő</span>
          </div>
          <ul className="mt-5 divide-y divide-border/50">
            {agentRuns.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium text-foreground">{r.agent}</div>
                  <div className="text-xs text-muted-foreground">{r.items} tétel · {r.time}</div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <h2 className="font-display text-xl">Legjobban pontozott tételek</h2>
          <ul className="mt-5 divide-y divide-border/50">
            {contentItems.slice().sort((a, b) => b.score - a.score).slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.category} · {i.source}</div>
                </div>
                <span className="font-mono text-sm text-signal">{i.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
