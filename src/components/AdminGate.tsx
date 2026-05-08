import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Client-only gate: session + rpc is_admin. Redirects to /admin/login when unauthenticated or not admin.
 * Uses onAuthStateChange so magic-link hash / PKCE tokens are applied before we reject "no session".
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function verify() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) {
            await navigate({ to: "/admin/login", replace: true });
          }
          return;
        }

        const { data: isAdmin, error } = await supabase.rpc("is_admin");
        if (cancelled) return;

        if (error || !isAdmin) {
          await navigate({ to: "/admin/login", replace: true });
          return;
        }

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) await navigate({ to: "/admin/login", replace: true });
      }
    }

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void verify();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="font-mono text-sm">Admin munkamenet ellenőrzése…</p>
      </div>
    );
  }

  return <>{children}</>;
}
