import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminGate } from "@/components/AdminGate";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/sponsors")({
  head: () => ({ meta: [{ title: "Szponzorok — Admin" }] }),
  component: SponsorsPage,
});

type LeadRow = {
  id: string;
  company: string;
  contact_name: string | null;
  email: string;
  category: string | null;
  status: string;
};

function SponsorsInner() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("sponsor_leads")
          .select("id, company, contact_name, email, category, status")
          .order("created_at", { ascending: false })
          .limit(200);
        if (cancelled) return;
        if (error) {
          setErr(error.message);
          return;
        }
        setRows((data ?? []) as LeadRow[]);
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
    <AdminLayout title="Szponzorok" subtitle="Érdeklődők és státusz — élő adat.">
      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card-gradient shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Cég</th>
                <th className="px-5 py-3 font-medium">Kapcsolattartó</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Kategória</th>
                <th className="px-5 py-3 font-medium">Állapot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    Nincs még lead.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4 font-medium text-foreground">{s.company}</td>
                    <td className="px-5 py-4 text-muted-foreground">{s.contact_name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <a
                        href={`mailto:${s.email}`}
                        className="text-muted-foreground hover:text-signal"
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{s.category ?? "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function SponsorsPage() {
  return (
    <AdminGate>
      <SponsorsInner />
    </AdminGate>
  );
}
