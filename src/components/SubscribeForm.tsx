import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check } from "lucide-react";

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setDone(true);
    setEmail("");
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <form onSubmit={onSubmit} className={`w-full ${compact ? "max-w-md" : "max-w-lg"}`}>
      <div className="glass flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:gap-1">
        <Input
          type="email"
          required
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 border-0 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <Button type="submit" variant="signal" size="lg" className="h-11 shrink-0">
          {done ? (
            <>You're in <Check className="ml-1 h-4 w-4" /></>
          ) : (
            <>Get the signal <ArrowRight className="ml-1 h-4 w-4" /></>
          )}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        One sharp briefing per week. No noise. Unsubscribe anytime.
      </p>
    </form>
  );
}
