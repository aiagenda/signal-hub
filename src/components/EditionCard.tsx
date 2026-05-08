import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Edition } from "@/lib/edition-types";

export function EditionCard({ edition }: { edition: Edition }) {
  const date = new Date(edition.date).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      to="/archive/$slug"
      params={{ slug: edition.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card-gradient p-7 shadow-card transition-all hover:-translate-y-1 hover:border-signal/40"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-signal">
          № {String(edition.number).padStart(3, "0")}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      <h3 className="mt-5 font-display text-2xl leading-tight text-foreground transition-colors group-hover:text-signal">
        {edition.title}
      </h3>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {edition.description}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {edition.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
          Olvasom
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
