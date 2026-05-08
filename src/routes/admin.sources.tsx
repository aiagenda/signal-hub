import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/sources")({
  head: () => ({ meta: [{ title: "Források — Admin" }] }),
  component: SourcesPage,
});

type SourceRow = {
  id: string;
  name: string;
  base_url: string | null;
  feed_url: string | null;
  category: string;
  active: boolean;
};

function SourcesInner() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("sources")
          .select("id, name, base_url, feed_url, category, active")
          .order("category")
          .order("name");
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          return;
        }
        setSources((data ?? []) as SourceRow[]);
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
    <AdminLayout
      title="Források"
      subtitle="Honnan jön a jel — RSS URL-eket a Supabase Table Editorben is szerkesztheted."
    >
      <div className="mb-5 flex justify-end">
        <Button
          variant="signal"
          size="sm"
          type="button"
          disabled
          title="Új sor: Supabase Dashboard → sources"
        >
          <Plus className="mr-1 h-4 w-4" /> Új forrás
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card-gradient shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Név</th>
                <th className="px-5 py-3 font-medium">Feed</th>
                <th className="px-5 py-3 font-medium">Kategória</th>
                <th className="px-5 py-3 font-medium">Állapot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sources.map((s) => {
                const url = s.feed_url || s.base_url || "#";
                return (
                  <tr key={s.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4 font-medium text-foreground">{s.name}</td>
                    <td className="px-5 py-4">
                      <a
                        href={url}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-signal"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {(url || "").replace(/^https?:\/\//, "").slice(0, 48)}
                        {url !== "#" ? <ExternalLink className="h-3 w-3" /> : null}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{s.category}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={s.active ? "active" : "inactive"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function SourcesPage() {
  return (
    <AdminGate>
      <SourcesInner />
    </AdminGate>
  );
}
