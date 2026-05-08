/** Public site URL for canonical / OG / sitemap (no trailing slash). */
export function getPublicSiteUrl(): string {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "http://localhost:5173";
}

export function useMockEditions(): boolean {
  return import.meta.env.VITE_USE_MOCK_EDITIONS === "true";
}

export function getOgImageAbsoluteUrl(): string {
  const base = getPublicSiteUrl();
  const path = (import.meta.env.VITE_OG_IMAGE_PATH || "/og-default.svg").trim();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function getPlausibleDomain(): string | undefined {
  const d = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();
  return d || undefined;
}

export function getGa4MeasurementId(): string | undefined {
  const id = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
  return id || undefined;
}
