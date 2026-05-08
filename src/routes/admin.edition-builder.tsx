import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Sparkles, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/edition-builder")({
  head: () => ({ meta: [{ title: "Kiadás-szerkesztő — Admin" }] }),
  component: BuilderPage,
});

const SECTION_LABELS: Record<string, string> = {
  global_ai: "Globális MI jel",
  tool_radar: "Eszköz-radar",
  builder: "Építő / Budapest üzlet",
  budapest: "Budapesti tech & üzlet",
  weekend: "Hétvégi jel",
};

type EditionItem = { id: string; title: string; summary: string | null; sort_order: number | null };
type EditionSection = {
  section_key: string;
  title: string;
  sort_order: number | null;
  edition_items: EditionItem[] | null;
};
type DraftEdition = {
  id: string;
  slug: string;
  number: number;
  title: string;
  status: string;
  edition_date: string | null;
  edition_sections: EditionSection[] | null;
};

function sortNum(a: number | null | undefined, b: number | null | undefined): number {
  return (a ?? 0) - (b ?? 0);
}

function BuilderInner() {
  const [edition, setEdition] = useState<DraftEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("editions")
          .select(
            `
            id, slug, number, title, status, edition_date,
            edition_sections (
              section_key, title, sort_order,
              edition_items ( id, title, summary, sort_order )
            )
          `,
          )
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          setErr(error.message);
          return;
        }
        setEdition(data as DraftEdition | null);
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

  const sections = edition?.edition_sections
    ? [...edition.edition_sections].sort((a, b) => sortNum(a.sort_order, b.sort_order))
    : [];

  const subtitle = edition
    ? `№ ${String(edition.number).padStart(3, "0")} · ${edition.title} — ${edition.edition_date ?? "dátum nincs"}`
    : "Nincs vázlat kiadás";

  return (
    <AdminLayout title="Kiadás-szerkesztő" subtitle={subtitle}>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant="signal"
          size="sm"
          type="button"
          disabled
          title="Futtasd lokálisan: npm run draft:edition"
        >
          <Sparkles className="mr-1 h-4 w-4" /> Vázlat generálása (CLI)
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled
          title="A nyilvános /archive nézet csak published kiadásra működik (RLS)."
        >
          <Eye className="mr-1 h-4 w-4" /> Nyilvános előnézet (publish után)
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && !edition && (
        <p className="text-sm text-muted-foreground">
          Még nincs draft kiadás. Futtasd a <span className="font-mono">draft:edition</span>{" "}
          worker-t.
        </p>
      )}

      {!loading && !err && edition && (
        <div className="grid gap-5 lg:grid-cols-2">
          {sections.map((sec) => {
            const label = SECTION_LABELS[sec.section_key] ?? sec.title;
            const items = [...(sec.edition_items ?? [])].sort((a, b) =>
              sortNum(a.sort_order, b.sort_order),
            );
            return (
              <div
                key={sec.section_key}
                className="rounded-2xl border border-border/60 bg-card-gradient p-6 shadow-card"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg">{label}</h3>
                  <span className="text-xs text-muted-foreground">{items.length} tétel</span>
                </div>
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Üres szekció
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((i) => (
                      <li
                        key={i.id}
                        className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/40 px-4 py-3 text-sm"
                      >
                        <span className="min-w-0 text-foreground">{i.title}</span>
                        {i.summary && (
                          <span className="text-xs text-muted-foreground line-clamp-3">
                            {i.summary}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

function BuilderPage() {
  return (
    <AdminGate>
      <BuilderInner />
    </AdminGate>
  );
}
