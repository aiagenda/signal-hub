import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { contentItems } from "@/lib/mock-data";
import { Sparkles, Eye, Check, Send } from "lucide-react";

export const Route = createFileRoute("/admin/edition-builder")({
  head: () => ({ meta: [{ title: "Edition Builder — Admin" }] }),
  component: BuilderPage,
});

const sectionMap = [
  { key: "Global AI", title: "Global AI Signal" },
  { key: "Tool Radar", title: "Tool Radar" },
  { key: "Budapest Business", title: "Builder Angle / Budapest" },
  { key: "Budapest Tech", title: "Budapest Tech & Business" },
  { key: "Weekend", title: "Weekend Signal" },
];

function BuilderPage() {
  return (
    <AdminLayout title="Edition Builder" subtitle="Edition № 025 · draft for Wed 03 May">
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="signal" size="sm"><Sparkles className="mr-1 h-4 w-4" /> Generate draft</Button>
        <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> Preview</Button>
        <Button variant="outline" size="sm"><Check className="mr-1 h-4 w-4" /> Mark ready</Button>
        <Button variant="outline" size="sm"><Send className="mr-1 h-4 w-4" /> Publish</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {sectionMap.map((sec) => {
          const items = contentItems.filter((i) => i.category === sec.key && i.status === "approved");
          return (
            <div key={sec.key} className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg">{sec.title}</h3>
                <span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
              </div>
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Drag approved items here
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1 truncate text-foreground">{i.title}</span>
                      <span className="font-mono text-xs text-signal">{i.score}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
