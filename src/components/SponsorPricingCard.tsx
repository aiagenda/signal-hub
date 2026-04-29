import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SponsorPricingCard({
  name, price, cadence, description, features, highlight,
}: {
  name: string; price: string; cadence: string; description: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-7 shadow-card transition-all ${
        highlight
          ? "border-signal/50 bg-card-gradient shadow-glow"
          : "border-border/60 bg-card-gradient hover:border-signal/30"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-7 rounded-full bg-signal-gradient px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-signal-foreground">
          Legnépszerűbb
        </span>
      )}
      <h3 className="font-display text-xl text-foreground">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-4xl text-foreground">{price}</span>
        <span className="text-xs text-muted-foreground">{cadence}</span>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant={highlight ? "signal" : "outline"} className="mt-7">
        <a href="#lead">Beszéljünk</a>
      </Button>
    </div>
  );
}
