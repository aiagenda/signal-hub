import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/agent-runs")({
  head: () => ({ meta: [{ title: "Ügynök-futások — Admin" }] }),
  component: AgentRunsPage,
});

type Row = {
  id: string;
  agent_name: string;
  status: string;
  items_processed: number;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
};

function formatRunTime(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt) return "—";
  const s = new Date(startedAt);
  if (!finishedAt) return `${s.toLocaleString("hu-HU")} · folyamatban`;
  const f = new Date(finishedAt);
  const sec = Math.round((f.getTime() - s.getTime()) / 1000);
  return `${s.toLocaleString("hu-HU")} · ${sec}s`;
}

function AgentRunsInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("agent_runs")
          .select("id, agent_name, status, items_processed, started_at, finished_at, error_message")
          .order("created_at", { ascending: false })
          .limit(80);
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          return;
        }
        setRows((data ?? []) as Row[]);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout title="Ügynök-futások" subtitle="Friss feltáró-, pontozó- és kurátor-tevékenység.">
      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}
      {!loading && !err && (
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Még nincs futás.</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card-gradient px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium text-foreground">{r.agent_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.items_processed} tétel · {formatRunTime(r.started_at, r.finished_at)}
                  </div>
                  {r.error_message && (
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-muted/40 p-2 text-[11px] text-destructive">
                      {r.error_message.slice(0, 2000)}
                    </pre>
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function AgentRunsPage() {
  return (
    <AdminGate>
      <AgentRunsInner />
    </AdminGate>
  );
}
