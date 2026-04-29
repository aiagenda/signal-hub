import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { contentItems } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Tartalmak — Admin" }] }),
  component: ContentPage,
});

const categories = ["Mind", ...Array.from(new Set(contentItems.map((i) => i.category)))];
const statuses = ["Mind", "approved", "review", "draft", "rejected"];
const statusLabels: Record<string, string> = {
  Mind: "Mind",
  approved: "Jóváhagyva",
  review: "Ellenőrzés",
  draft: "Vázlat",
  rejected: "Elutasítva",
};

function ContentPage() {
  const [cat, setCat] = useState("Mind");
  const [status, setStatus] = useState("Mind");

  const filtered = useMemo(
    () => contentItems.filter(
      (i) => (cat === "Mind" || i.category === cat) && (status === "Mind" || i.status === status)
    ),
    [cat, status]
  );

  return (
    <AdminLayout title="Tartalmak" subtitle="Mindaz, amit az ügynökök ebben a ciklusban behoztak.">
      <div className="mb-5 flex flex-wrap gap-3">
        <Filter label="Kategória" value={cat} options={categories} onChange={setCat} />
        <Filter label="Állapot" value={status} options={statuses} onChange={setStatus} renderOption={(o) => statusLabels[o] ?? o} />
        <span className="ml-auto self-end text-xs text-muted-foreground">{filtered.length} tétel</span>
      </div>

      <div className="grid gap-3">
        {filtered.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card-gradient px-5 py-4 shadow-card">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{i.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{i.category} · {i.source}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">pont</span>
              <span className="font-mono text-base text-signal">{i.score}</span>
            </div>
            <StatusBadge status={i.status} />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function Filter({
  label, value, options, onChange, renderOption,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
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
        {options.map((o) => <option key={o} value={o} className="bg-background">{renderOption ? renderOption(o) : o}</option>)}
      </select>
    </div>
  );
}
