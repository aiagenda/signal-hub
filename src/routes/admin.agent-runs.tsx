import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { agentRuns } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/agent-runs")({
  head: () => ({ meta: [{ title: "Agent Runs — Admin" }] }),
  component: () => (
    <AdminLayout title="Agent runs" subtitle="Recent crawler, scorer and curator activity.">
      <div className="grid gap-3">
        {agentRuns.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card-gradient px-5 py-4 shadow-card">
            <div>
              <div className="font-medium text-foreground">{r.agent}</div>
              <div className="text-xs text-muted-foreground">{r.items} items processed · {r.time}</div>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </AdminLayout>
  ),
});
