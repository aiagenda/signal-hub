/**
 * Ideiglenesen nincs auth: az admin útvonalak nyitottak (korábban session + is_admin RPC).
 * Ha újra kell védelem, állítsd vissza a Supabase gate-et itt.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
