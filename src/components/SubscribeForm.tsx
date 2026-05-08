import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!hasSupabaseEnv()) {
      toast.error("Feliratkozás nincs konfigurálva. Állítsd be a VITE_SUPABASE_* változókat.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("subscribers").insert({ email: trimmed });

      if (!error) {
        setDone(true);
        setEmail("");
        toast.success("Feliratkoztál — köszönjük!");
        setTimeout(() => setDone(false), 4000);
        return;
      }

      const code = (error as { code?: string }).code;
      const msg = error.message ?? "";
      if (code === "23505" || /duplicate|unique/i.test(msg)) {
        toast.message("Már fel vagy iratkozva erre a címre.", {
          description: "Ha nem kapsz leveleket, nézd meg a spam mappát.",
        });
        setEmail("");
        return;
      }

      toast.error("Sikertelen feliratkozás", { description: msg });
    } catch (err) {
      toast.error("Hálózati hiba", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={`w-full ${compact ? "max-w-md" : "max-w-lg"}`}>
      <div className="glass flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:gap-1">
        <Input
          type="email"
          required
          placeholder="te@studio.hu"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 border-0 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <Button
          type="submit"
          variant="signal"
          size="lg"
          className="h-11 shrink-0"
          disabled={loading}
        >
          {done ? (
            <>
              Sikerült <Check className="ml-1 h-4 w-4" />
            </>
          ) : loading ? (
            "Küldés…"
          ) : (
            <>
              Kérem a jelet <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Heti egy éles briefing. Nincs zaj. Bármikor leiratkozhatsz.
      </p>
    </form>
  );
}
