import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { contentItems } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Content Items — Admin" }] }),
  component: ContentPage,
});

const categories = ["All", ...Array.from(new Set(contentItems.map((i) => i.category)))];
const statuses = ["All", "approved", "review", "draft", "rejected"];

function ContentPage() {
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(
    () => contentItems.filter(
      (i) => (cat === "All" || i.category === cat) && (status === "All" || i.status === status)
    ),
    [cat, status]
  );

  return (
    <AdminLayout title="Content items" subtitle="Everything the agents pulled this cycle.">
      <div className="mb-5 flex flex-wrap gap-3">
        <Filter label="Category" value={cat} options={categories} onChange={setCat} />
        <Filter label="Status" value={status} options={statuses} onChange={setStatus} />
        <span className="ml-auto self-end text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      <div className="grid gap-3">
        {filtered.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card-gradient px-5 py-4 shadow-card">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{i.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{i.category} · {i.source}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">score</span>
              <span className="font-mono text-base text-signal">{i.score}</span>
            </div>
            <StatusBadge status={i.status} />
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs">
      <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-foreground focus:outline-none"
      >
        {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
      </select>
    </div>
  );
}
