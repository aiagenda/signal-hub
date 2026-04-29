import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { sponsors } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/sponsors")({
  head: () => ({ meta: [{ title: "Sponsors — Admin" }] }),
  component: SponsorsPage,
});

function SponsorsPage() {
  return (
    <AdminLayout title="Sponsors" subtitle="Leads, partners and active campaigns.">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card-gradient shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Tier</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sponsors.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/20">
                <td className="px-5 py-4 font-medium text-foreground">{s.company}</td>
                <td className="px-5 py-4 text-muted-foreground">{s.contact}</td>
                <td className="px-5 py-4">
                  <a href={`mailto:${s.email}`} className="text-muted-foreground hover:text-signal">{s.email}</a>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{s.category}</td>
                <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
