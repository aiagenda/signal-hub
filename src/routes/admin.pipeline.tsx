import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline health — Admin" }] }),
  component: AdminPipelinePage,
});

type PipelineJobRow = {
  id: string;
  workflow: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
};

type SourceHealthRow = {
  source_id: string;
  consecutive_failures: number;
  last_failure_at: string | null;
  sources: { name: string; feed_url: string | null; active: boolean } | null;
};

type SocialQueueRow = {
  status: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" });
}

function AdminPipelineInner() {
  const [jobs, setJobs] = useState<PipelineJobRow[]>([]);
  const [health, setHealth] = useState<SourceHealthRow[]>([]);
  const [social, setSocial] = useState<SocialQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const [{ data: j, error: jErr }, { data: h, error: hErr }, { data: s, error: sErr }] =
          await Promise.all([
            supabase
              .from("pipeline_jobs")
              .select("id,workflow,status,started_at,finished_at,error_message,created_at")
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("source_health")
              .select("source_id,consecutive_failures,last_failure_at,sources(name,feed_url,active)")
              .order("consecutive_failures", { ascending: false })
              .limit(50),
            supabase.from("social_posts").select("status").limit(1000),
          ]);
        if (cancelled) return;
        if (jErr || hErr || sErr) {
          throw new Error(jErr?.message || hErr?.message || sErr?.message || "Unknown error");
        }
        setJobs((j ?? []) as PipelineJobRow[]);
        setHealth((h ?? []) as SourceHealthRow[]);
        setSocial((s ?? []) as SocialQueueRow[]);
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

  const socialSummary = useMemo(() => {
    const count = (status: string) => social.filter((s) => s.status === status).length;
    return {
      draft: count("draft"),
      queued: count("queued"),
      posted: count("posted"),
      failed: count("failed"),
    };
  }, [social]);

  const failingSources = health.filter((h) => h.consecutive_failures > 0);
  const failedJobs = jobs.filter((j) => j.status === "failed" || j.status === "failed_permanent");

  async function retryJob(jobId: string) {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("pipeline_jobs")
      .update({
        status: "queued",
        next_run_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", jobId);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "queued", error_message: null } : j)));
  }

  async function deactivateSource(sourceId: string) {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("sources").update({ active: false }).eq("id", sourceId);
    setHealth((prev) =>
      prev.map((h) => (h.source_id === sourceId ? { ...h, sources: h.sources ? { ...h.sources, active: false } : h.sources } : h)),
    );
  }

  return (
    <AdminLayout title="Pipeline health" subtitle="Queue, források, social állapot és hibák">
      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Social draft" value={socialSummary.draft} />
            <Kpi label="Social queued" value={socialSummary.queued} />
            <Kpi label="Social posted" value={socialSummary.posted} />
            <Kpi label="Social failed" value={socialSummary.failed} />
          </div>

          <section className="rounded-xl border border-border/60 bg-card-gradient p-5 shadow-card">
            <h3 className="font-display text-xl">Failed pipeline jobs</h3>
            <div className="mt-4 grid gap-3">
              {failedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nincs failed job.</p>
              ) : (
                failedJobs.slice(0, 10).map((j) => (
                  <div key={j.id} className="rounded-lg border border-border/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{j.workflow}</div>
                      <StatusBadge status={j.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      started: {formatDate(j.started_at)} · finished: {formatDate(j.finished_at)}
                    </div>
                    {j.error_message ? (
                      <pre className="mt-2 max-h-20 overflow-auto rounded bg-muted/40 p-2 text-[11px] text-destructive">
                        {j.error_message}
                      </pre>
                    ) : null}
                    <button
                      type="button"
                      className="mt-2 rounded border border-border/60 px-2 py-1 text-xs hover:bg-muted/40"
                      onClick={() => retryJob(j.id)}
                    >
                      Retry job
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card-gradient p-5 shadow-card">
            <h3 className="font-display text-xl">Source health / circuit breaker</h3>
            <div className="mt-4 grid gap-3">
              {failingSources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nincs hibázó feed jelenleg.</p>
              ) : (
                failingSources.map((h) => (
                  <div key={h.source_id} className="rounded-lg border border-border/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{h.sources?.name ?? h.source_id}</div>
                      <span className="font-mono text-xs text-muted-foreground">
                        fails: {h.consecutive_failures}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      active: {h.sources?.active ? "yes" : "no"} · last failure:{" "}
                      {formatDate(h.last_failure_at)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{h.sources?.feed_url ?? "—"}</div>
                    <button
                      type="button"
                      className="mt-2 rounded border border-border/60 px-2 py-1 text-xs hover:bg-muted/40"
                      onClick={() => deactivateSource(h.source_id)}
                    >
                      Deactivate source
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-gradient p-4 shadow-card">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl text-foreground">{value}</p>
    </div>
  );
}

function AdminPipelinePage() {
  return (
    <AdminGate>
      <AdminPipelineInner />
    </AdminGate>
  );
}
