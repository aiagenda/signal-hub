import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { submitEvent } from "@/lib/events-repo";
import { EVENT_CATEGORY_LABELS, HUNGARIAN_REGIONS } from "@/lib/event-types";

export const Route = createFileRoute("/events/submit")({
  head: () => ({
    meta: [
      { title: "Esemény beküldése — Programradar" },
      {
        name: "description",
        content:
          "Küld be az eseményedet ingyenesen. Konferencia, buli, fesztivál, meetup — minden típus jöhet.",
      },
    ],
  }),
  component: EventSubmitPage,
});

function EventSubmitPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    venue: "",
    city: "",
    region: "",
    priceInfo: "",
    ticketUrl: "",
    description: "",
    organizerName: "",
    organizerEmail: "",
    category: "",
    tags: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitEvent({
        title: form.title,
        startsAt: form.startsAt,
        endsAt: form.endsAt || undefined,
        venue: form.venue || undefined,
        city: form.city,
        region: form.region || undefined,
        priceInfo: form.priceInfo || undefined,
        ticketUrl: form.ticketUrl || undefined,
        description: form.description || undefined,
        organizerName: form.organizerName,
        organizerEmail: form.organizerEmail,
        category: form.category || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-signal" />
            <h1 className="mt-5 font-display text-3xl">Sikeresen beküldve!</h1>
            <p className="mt-3 text-muted-foreground">
              Köszönjük! Az eseményed moderálás után kerül fel az oldalra. Általában 24 órán belül
              elvégezzük az ellenőrzést.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/events"
                search={{ region: undefined, category: undefined, from: undefined }}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Vissza az eseményekhez
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Link
            to="/events"
            search={{ region: undefined, category: undefined, from: undefined }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Vissza az eseményekhez
          </Link>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-signal">Beküldés</p>
          <h1 className="mt-3 font-display text-4xl">Küld be az eseményedet.</h1>
          <p className="mt-3 text-muted-foreground">
            Ingyenes. Moderálás után kerül fel. Minden típus jöhet — buli, fesztivál, konferencia,
            meetup.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col gap-5">
              <h2 className="font-display text-xl">Esemény adatai</h2>

              <Field label="Esemény neve *">
                <input
                  type="text"
                  required
                  placeholder="pl. Budapest Tech Meetup #42"
                  value={form.title}
                  onChange={set("title")}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kezdési időpont *">
                  <input
                    type="datetime-local"
                    required
                    value={form.startsAt}
                    onChange={set("startsAt")}
                    className={inputCls}
                  />
                </Field>
                <Field label="Befejezés (opcionális)">
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={set("endsAt")}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Kategória">
                <select value={form.category} onChange={set("category")} className={inputCls}>
                  <option value="">Válassz kategóriát</option>
                  {Object.entries(EVENT_CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Leírás">
                <textarea
                  rows={4}
                  placeholder="Miről szól az esemény? Mi várható, ki jöhet..."
                  value={form.description}
                  onChange={set("description")}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Helyszín neve">
                  <input
                    type="text"
                    placeholder="pl. Szimpla Kert, Budapest Park"
                    value={form.venue}
                    onChange={set("venue")}
                    className={inputCls}
                  />
                </Field>
                <Field label="Város *">
                  <input
                    type="text"
                    required
                    placeholder="pl. Budapest, Debrecen, Békéscsaba"
                    value={form.city}
                    onChange={set("city")}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Régió">
                <select value={form.region} onChange={set("region")} className={inputCls}>
                  <option value="">Válassz régiót</option>
                  {HUNGARIAN_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Belépő / Ár">
                  <input
                    type="text"
                    placeholder="pl. Ingyenes, 2500 Ft-tól, 5000–8000 Ft"
                    value={form.priceInfo}
                    onChange={set("priceInfo")}
                    className={inputCls}
                  />
                </Field>
                <Field label="Jegy / Regisztrációs link">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.ticketUrl}
                    onChange={set("ticketUrl")}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Cimkék (vesszővel elválasztva)">
                <input
                  type="text"
                  placeholder="pl. elektronikus zene, startup, open bar"
                  value={form.tags}
                  onChange={set("tags")}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col gap-5">
              <h2 className="font-display text-xl">Szervező adatai</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Szervező neve / Szervezet *">
                  <input
                    type="text"
                    required
                    placeholder="pl. Budapest AI Közösség"
                    value={form.organizerName}
                    onChange={set("organizerName")}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email cím *">
                  <input
                    type="email"
                    required
                    placeholder="hello@pelda.hu"
                    value={form.organizerEmail}
                    onChange={set("organizerEmail")}
                    className={inputCls}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Az email cím nem jelenik meg publikusan, csak moderáláshoz szükséges.
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" variant="signal" disabled={busy} className="self-start px-8">
              {busy ? "Küldés…" : "Esemény beküldése"}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-signal/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
