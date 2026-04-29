import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, FileEdit, Inbox, Megaphone, Activity } from "lucide-react";
import { metrics, agentRuns, contentItems } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Budapest Signal" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard" subtitle="The signal at a glance.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={Users} label="Subscribers" value={metrics.subscribers.toLocaleString()} hint={metrics.subscribersDelta} />
        <MetricCard icon={FileEdit} label="Draft editions" value={metrics.draftEditions} hint="Edition № 025" />
        <MetricCard icon={Inbox} label="Pending items" value={metrics.pendingItems} hint="Awaiting review" />
        <MetricCard icon={Megaphone} label="Sponsor leads" value={metrics.sponsorLeads} hint="New this week" />
        <MetricCard icon={Activity} label="Agent runs" value={metrics.agentRuns} hint="Last 24h" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Recent agent runs</h2>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <ul className="mt-5 divide-y divide-border/50">
            {agentRuns.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium text-foreground">{r.agent}</div>
                  <div className="text-xs text-muted-foreground">{r.items} items · {r.time}</div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <h2 className="font-display text-xl">Top scored items</h2>
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
