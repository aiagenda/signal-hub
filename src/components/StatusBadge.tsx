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
  new: { cls: "bg-signal/15 text-signal border-signal/30", label: "új" },
  failed: { cls: "bg-destructive/15 text-destructive border-destructive/30", label: "hiba" },
  failed_permanent: { cls: "bg-destructive/15 text-destructive border-destructive/30", label: "végleges hiba" },
  retrying: { cls: "bg-warning/15 text-warning border-warning/30", label: "újrapróba" },
  skipped: { cls: "bg-muted text-muted-foreground border-border", label: "kihagyva" },
  contacted: { cls: "bg-warning/15 text-warning border-warning/30", label: "megkeresve" },
  published: { cls: "bg-success/15 text-success border-success/30", label: "publikált" },
  quality_passed: { cls: "bg-signal/15 text-signal border-signal/30", label: "quality pass" },
  archived: { cls: "bg-muted text-muted-foreground border-border", label: "archivált" },
  seo_ready: { cls: "bg-signal/15 text-signal border-signal/30", label: "seo kész" },
  posted: { cls: "bg-success/15 text-success border-success/30", label: "kiküldve" },
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
