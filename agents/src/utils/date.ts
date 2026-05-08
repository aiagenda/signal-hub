export function isoOrNull(d: Date | undefined | null): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
