/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PUBLIC_SITE_URL: string;
  readonly VITE_USE_MOCK_EDITIONS?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_OG_IMAGE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
