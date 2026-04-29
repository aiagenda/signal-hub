const map: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  success: "bg-success/15 text-success border-success/30",
  approved: "bg-success/15 text-success border-success/30",
  won: "bg-success/15 text-success border-success/30",
  running: "bg-signal/15 text-signal border-signal/30",
  review: "bg-warning/15 text-warning border-warning/30",
  negotiating: "bg-warning/15 text-warning border-warning/30",
  draft: "bg-muted text-muted-foreground border-border",
  queued: "bg-muted text-muted-foreground border-border",
  lead: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = map[status.toLowerCase()] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
