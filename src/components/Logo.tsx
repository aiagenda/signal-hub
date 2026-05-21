import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-signal-gradient shadow-glow">
        <span
          className="absolute inset-0 rounded-lg bg-signal/40 blur-md animate-pulse-signal"
          aria-hidden
        />
        <span className="relative h-2 w-2 rounded-full bg-background" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-medium tracking-tight text-foreground">
          Program<span className="text-gradient-signal">radar</span>
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Események HU
        </span>
      </span>
    </Link>
  );
}
