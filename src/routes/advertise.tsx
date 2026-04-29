import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SponsorPricingCard } from "@/components/SponsorPricingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { pricingTiers } from "@/lib/mock-data";
import { Check } from "lucide-react";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise — Budapest Signal" },
      { name: "description", content: "Reach Budapest's AI, tech and business-minded audience through editorial-grade placements." },
    ],
  }),
  component: Advertise,
});

function Advertise() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/50 bg-hero-gradient">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Partner with us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight md:text-6xl">
            Advertise to Budapest's tech, AI and business-minded audience.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Native, editorial placements inside a weekly briefing that founders, operators and senior ICs actually open. No display ads, no clickbait — just respect for the reader and your brand.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Highlight value="62%" label="Avg. open rate" />
            <Highlight value="8,420" label="Engaged readers" />
            <Highlight value="48%" label="Founders & senior ICs" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Placements</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Pick your signal strength.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pricingTiers.map((t) => <SponsorPricingCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      <section id="lead" className="py-20">
        <div className="mx-auto grid max-w-5xl gap-12 px-5 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Talk to us</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">Tell us what you're launching.</h2>
            <p className="mt-4 text-muted-foreground">
              We reply within two business days with availability, audience fit and recommended placement.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-foreground/85">
              {["Editorial-grade copy, written by us", "Hard cap of one partner per edition section", "Performance recap within 7 days", "Refund if open rate drops below 50%"].map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-signal" />{f}</li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-2xl border border-border/60 bg-card-gradient p-7 shadow-card"
          >
            {sent ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/15"><Check className="h-6 w-6 text-signal" /></div>
                <h3 className="mt-5 font-display text-2xl">Thanks — we got it.</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">We'll be in touch within two business days with availability and a recommended placement.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Field label="Company name"><Input required placeholder="Acme Co." /></Field>
                <Field label="Contact name"><Input required placeholder="Anna Kovács" /></Field>
                <Field label="Work email"><Input type="email" required placeholder="anna@acme.co" /></Field>
                <Field label="Website"><Input type="url" placeholder="https://acme.co" /></Field>
                <Field label="What are you launching?">
                  <Textarea rows={4} placeholder="A few sentences on the product, audience and timing." />
                </Field>
                <Button type="submit" variant="signal" size="lg" className="mt-2">Send the brief</Button>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Highlight({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur">
      <div className="font-display text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
