import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin bejelentkezés — Budapest Signal" }] }),
  component: AdminLoginPage,
});

/** Maps Supabase Auth errors (e.g. OTP rate limit 429) to readable HU copy. */
function formatMagicLinkError(err: { message: string; status?: number; code?: string }): string {
  const msg = err.message.toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  if (
    err.status === 429 ||
    code.includes("rate") ||
    msg.includes("rate limit") ||
    msg.includes("email rate") ||
    msg.includes("too many requests") ||
    msg.includes("429")
  ) {
    return (
      "A Supabase Auth ideiglenesen nem küld több e-mailt rövid idő alatt (rate limit). " +
      "Várj 2–15 percet, ne nyomd többször a gombot ugyanarra az e-mailre. " +
      "Projektbeállítás: Dashboard → Authentication → Rate Limits / saját SMTP növelheti a kvótát."
    );
  }
  return err.message;
}

async function tryRedirectIfAdmin(supabase: ReturnType<typeof getSupabaseBrowserClient>): Promise<{
  redirected: boolean;
  noAdminReason?: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { redirected: false };
  }

  const { data: isAdmin, error: rpcErr } = await supabase.rpc("is_admin");

  if (rpcErr) {
    return {
      redirected: false,
      noAdminReason: rpcErr.message || "is_admin RPC hiba — futtasd a migrációt (is_admin grant)?",
    };
  }

  if (!isAdmin) {
    return {
      redirected: false,
      noAdminReason:
        "Ez az e-mail nincs admin jogosultsággal. Add hozzá az admin_emails táblához (SQL), vagy állítsd profiles.role = 'admin', majd jelentkezz ki és újra.",
    };
  }

  return { redirected: true };
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function attemptRedirect() {
      try {
        const { redirected, noAdminReason } = await tryRedirectIfAdmin(supabase);
        if (cancelled) return;
        if (noAdminReason) {
          setError(noAdminReason);
          return;
        }
        if (redirected) {
          await navigate({ to: "/admin", replace: true });
        }
      } catch {
        /* ignore */
      }
    }

    void attemptRedirect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void attemptRedirect();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      // Same path where we handle hash / PKCE tokens after click — keeps port (e.g. :8080) consistent.
      const redirectTo = `${window.location.origin}/admin/login`;
      const { error: signErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (signErr) {
        setError(formatMagicLinkError(signErr));
        return;
      }
      setMessage("Ellenőrizd a postafiókod — elküldtük a belépő linket.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Ismeretlen hiba";
      setError(formatMagicLinkError({ message: raw }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero-gradient px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card-gradient p-8 shadow-card">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Admin</p>
        <h1 className="mt-2 font-display text-2xl text-foreground">Bejelentkezés</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Csak meghívott admin e-mail címek (Supabase Auth +{" "}
          <span className="font-mono">admin_emails</span> /{" "}
          <span className="font-mono">profiles.role</span>).
        </p>

        <form onSubmit={sendMagicLink} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-foreground">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-signal/40"
              placeholder="te@pelda.hu"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}
          <Button type="submit" variant="signal" disabled={busy} className="w-full">
            {busy ? "Küldés…" : "Magic link küldése"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="text-signal hover:underline">
            Vissza a főoldalra
          </Link>
        </p>
      </div>
    </div>
  );
}
