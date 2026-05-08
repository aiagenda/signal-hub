import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/AdminGate";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const Route = createFileRoute("/admin/articles")({
  head: () => ({ meta: [{ title: "Cikkek — Admin" }] }),
  component: AdminArticlesPage,
});

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "seo_ready" | "published" | "archived";
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
};

type SocialCount = {
  article_id: string;
  status: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" });
}

function AdminArticlesInner() {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [socialRows, setSocialRows] = useState<SocialCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const [{ data: articles, error: aErr }, { data: socials, error: sErr }] = await Promise.all([
        supabase
          .from("articles")
          .select("id, slug, title, status, seo_title, seo_description, published_at, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("social_posts").select("article_id,status").not("article_id", "is", null).limit(500),
      ]);

      if (aErr) throw new Error(aErr.message);
      if (sErr) throw new Error(sErr.message);
      setRows((articles ?? []) as ArticleRow[]);
      setSocialRows((socials ?? []) as SocialCount[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function socialStats(articleId: string): string {
    const all = socialRows.filter((x) => x.article_id === articleId);
    if (all.length === 0) return "social: nincs";
    const draft = all.filter((x) => x.status === "draft").length;
    const queued = all.filter((x) => x.status === "queued").length;
    const posted = all.filter((x) => x.status === "posted").length;
    const failed = all.filter((x) => x.status === "failed").length;
    return `social d:${draft} q:${queued} p:${posted} f:${failed}`;
  }

  async function publish(articleId: string) {
    setBusyId(articleId);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("articles")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", articleId);
      if (error) throw new Error(error.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function unpublish(articleId: string) {
    setBusyId(articleId);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("articles")
        .update({ status: "seo_ready", published_at: null })
        .eq("id", articleId);
      if (error) throw new Error(error.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function queueDraftSocial(articleId: string) {
    setBusyId(articleId);
    setErr(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("social_posts")
        .update({ status: "queued" })
        .eq("article_id", articleId)
        .eq("status", "draft");
      if (error) throw new Error(error.message);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout title="Cikkek" subtitle="Longform pipeline: draft → seo_ready → published + social queue">
      {loading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {!loading && !err && (
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Még nincs cikk.</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border/60 bg-card-gradient p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-muted-foreground">{r.slug}</p>
                    <h3 className="mt-1 text-lg font-medium text-foreground">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      created: {formatDate(r.created_at)} · published: {formatDate(r.published_at)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{socialStats(r.id)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status !== "published" ? (
                    <Button
                      size="sm"
                      variant="signal"
                      disabled={busyId === r.id}
                      onClick={() => void publish(r.id)}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => void unpublish(r.id)}
                    >
                      Unpublish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => void queueDraftSocial(r.id)}
                  >
                    Queue social drafts
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function AdminArticlesPage() {
  return (
    <AdminGate>
      <AdminArticlesInner />
    </AdminGate>
  );
}
