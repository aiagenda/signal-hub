const map: Record<string, { cls: string; label: string }> = {
  active: { cls: "bg-success/15 text-success border-success/30", label: "aktív" },
  success: { cls: "bg-success/15 text-success border-success/30", label: "siker" },
  approved: { cls: "bg-success/15 text-success border-success/30", label: "jóváhagyva" },
  won: { cls: "bg-success/15 text-success border-success/30", label: "megnyerve" },
  running: { cls: "bg-signal/15 text-signal border-signal/30", label: "fut" },
  review: { cls: "bg-warning/15 text-warning border-warning/30", label: "ellenőrzés" },
  negotiating: { cls: "bg-warning/15 text-warning border-warning/30", label: "tárgyalás" },
  draft: { cls: "bg-muted text-muted-foreground border-border", label: "vázlat" },
  queued: { cls: "bg-muted text-muted-foreground border-border", label: "sorban" },
  lead: { cls: "bg-muted text-muted-foreground border-border", label: "érdeklődő" },
  rejected: { cls: "bg-destructive/15 text-destructive border-destructive/30", label: "elutasítva" },
  lost: { cls: "bg-destructive/15 text-destructive border-destructive/30", label: "elveszett" },
  inactive: { cls: "bg-muted text-muted-foreground border-border", label: "inaktív" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = map[status.toLowerCase()] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${entry.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {entry.label}
    </span>
  );
}
