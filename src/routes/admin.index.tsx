import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, FileEdit, Inbox, Megaphone, Activity } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin áttekintés — Budapest Signal" }] }),
  component: AdminDashboardPage,
});

type AgentRunRow = {
  id: string;
  agent_name: string;
  status: string;
  items_processed: number;
  started_at: string | null;
  finished_at: string | null;
};

type ContentTopRow = {
  id: string;
  title: string;
  category: string;
  score: number | null;
  sources: { name: string } | null;
};

function formatRunTime(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt) return "—";
  const s = new Date(startedAt);
  if (!finishedAt) return s.toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" });
  const f = new Date(finishedAt);
  const sec = Math.round((f.getTime() - s.getTime()) / 1000);
  return `${s.toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" })} · ${sec}s`;
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState(0);
  const [draftEditions, setDraftEditions] = useState(0);
  const [pendingItems, setPendingItems] = useState(0);
  const [sponsorLeads, setSponsorLeads] = useState(0);
  const [runs24h, setRuns24h] = useState(0);
  const [latestDraftLabel, setLatestDraftLabel] = useState<string>("—");
  const [agentRuns, setAgentRuns] = useState<AgentRunRow[]>([]);
  const [topItems, setTopItems] = useState<ContentTopRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
          subRes,
          draftRes,
          pendingRes,
          sponsorRes,
          runsCountRes,
          runsRes,
          topRes,
          latestDraftRes,
        ] = await Promise.all([
          supabase
            .from("subscribers")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("editions")
            .select("id", { count: "exact", head: true })
            .eq("status", "draft"),
          supabase
            .from("content_items")
            .select("id", { count: "exact", head: true })
            .in("status", ["draft", "review"]),
          supabase
            .from("sponsor_leads")
            .select("id", { count: "exact", head: true })
            .in("status", ["new", "lead"]),
          supabase
            .from("agent_runs")
            .select("id", { count: "exact", head: true })
            .gte("created_at", since),
          supabase
            .from("agent_runs")
            .select("id, agent_name, status, items_processed, started_at, finished_at")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("content_items")
            .select("id, title, category, score, sources(name)")
            .order("score", { ascending: false, nullsFirst: false })
            .limit(5),
          supabase
            .from("editions")
            .select("number, title")
            .eq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const err =
          subRes.error?.message ||
          draftRes.error?.message ||
          pendingRes.error?.message ||
          sponsorRes.error?.message ||
          runsCountRes.error?.message ||
          runsRes.error?.message ||
          topRes.error?.message ||
          latestDraftRes.error?.message;

        if (err) {
          setLoadError(err);
          return;
        }

        setSubscribers(subRes.count ?? 0);
        setDraftEditions(draftRes.count ?? 0);
        setPendingItems(pendingRes.count ?? 0);
        setSponsorLeads(sponsorRes.count ?? 0);
        setRuns24h(runsCountRes.count ?? 0);
        setAgentRuns((runsRes.data ?? []) as AgentRunRow[]);
        setTopItems((topRes.data ?? []) as ContentTopRow[]);
        if (latestDraftRes.data) {
          const d = latestDraftRes.data as { number: number; title: string };
          setLatestDraftLabel(`№ ${String(d.number).padStart(3, "0")} · ${d.title}`);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Áttekintés" subtitle="Betöltés…">
        <p className="text-sm text-muted-foreground">Adatok lekérése…</p>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Áttekintés" subtitle="Hiba">
        <p className="text-sm text-destructive">{loadError}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Áttekintés" subtitle="A jel egy pillantásra — élő adat a Supabase-ből.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon={Users}
          label="Feliratkozók (aktív)"
          value={subscribers.toLocaleString("hu-HU")}
          hint="subscribers.status = active"
        />
        <MetricCard
          icon={FileEdit}
          label="Vázlat kiadások"
          value={draftEditions.toLocaleString("hu-HU")}
          hint={latestDraftLabel}
        />
        <MetricCard
          icon={Inbox}
          label="Tartalom (draft/review)"
          value={pendingItems.toLocaleString("hu-HU")}
          hint="Ellenőrzésre vár"
        />
        <MetricCard
          icon={Megaphone}
          label="Szponzor érdeklődők"
          value={sponsorLeads.toLocaleString("hu-HU")}
          hint="new / lead"
        />
        <MetricCard
          icon={Activity}
          label="Ügynök-futások (24h)"
          value={runs24h.toLocaleString("hu-HU")}
          hint="agent_runs"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Legutóbbi ügynök-futások</h2>
            <span className="text-xs text-muted-foreground">Élő</span>
          </div>
          <ul className="mt-5 divide-y divide-border/50">
            {agentRuns.length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">Még nincs futás.</li>
            ) : (
              agentRuns.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{r.agent_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.items_processed} tétel · {formatRunTime(r.started_at, r.finished_at)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
          <h2 className="font-display text-xl">Legjobban pontozott tételek</h2>
          <ul className="mt-5 divide-y divide-border/50">
            {topItems.length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">Nincs még tétel.</li>
            ) : (
              topItems.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{i.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.category} · {i.sources?.name ?? "—"}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-signal">{i.score ?? "—"}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

function AdminDashboardPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
