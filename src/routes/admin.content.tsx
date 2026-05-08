import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Tartalmak — Admin" }] }),
  component: ContentPage,
});

type ItemRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  score: number | null;
  sources: { name: string } | null;
};

const statuses = ["Mind", "approved", "review", "draft", "rejected"] as const;
const statusLabels: Record<string, string> = {
  Mind: "Mind",
  approved: "Jóváhagyva",
  review: "Ellenőrzés",
  draft: "Vázlat",
  rejected: "Elutasítva",
};

function ContentInner() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [cat, setCat] = useState("Mind");
  const [status, setStatus] = useState<string>("Mind");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("content_items")
          .select("id, title, category, status, score, sources(name)")
          .order("created_at", { ascending: false })
          .limit(500);
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          return;
        }
        setItems((data ?? []) as ItemRow[]);
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

  const categories = useMemo(
    () => ["Mind", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => (cat === "Mind" || i.category === cat) && (status === "Mind" || i.status === status),
      ),
    [items, cat, status],
  );

  return (
    <AdminLayout title="Tartalmak" subtitle="Mindaz, amit az ügynökök ebben a ciklusban behoztak.">
      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && (
        <>
          <div className="mb-5 flex flex-wrap gap-3">
            <Filter label="Kategória" value={cat} options={categories} onChange={setCat} />
            <Filter
              label="Állapot"
              value={status}
              options={[...statuses]}
              onChange={setStatus}
              renderOption={(o) => statusLabels[o] ?? o}
            />
            <span className="ml-auto self-end text-xs text-muted-foreground">
              {filtered.length} tétel (max 500 betöltve)
            </span>
          </div>

          <div className="grid gap-3">
            {filtered.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card-gradient px-5 py-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{i.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {i.category} · {i.sources?.name ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">pont</span>
                  <span className="font-mono text-base text-signal">{i.score ?? "—"}</span>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (o: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs">
      <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-foreground focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ContentPage() {
  return (
    <AdminGate>
      <ContentInner />
    </AdminGate>
  );
}
