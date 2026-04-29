import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { sources } from "@/lib/mock-data";
import { Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/sources")({
  head: () => ({ meta: [{ title: "Sources — Admin" }] }),
  component: SourcesPage,
});

function SourcesPage() {
  return (
    <AdminLayout title="Sources" subtitle="Where the signal comes from.">
      <div className="mb-5 flex justify-end">
        <Button variant="signal" size="sm"><Plus className="mr-1 h-4 w-4" /> Add source</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card-gradient shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">URL</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sources.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/20">
                <td className="px-5 py-4 font-medium text-foreground">{s.name}</td>
                <td className="px-5 py-4">
                  <a href={s.url} className="inline-flex items-center gap-1 text-muted-foreground hover:text-signal" target="_blank" rel="noreferrer">
                    {s.url.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{s.category}</td>
                <td className="px-5 py-4"><StatusBadge status={s.active ? "active" : "inactive"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
