import type {
  Edition,
  EditionItemView,
  EditionSectionKey,
  EditionSectionView,
} from "@/lib/edition-types";
import { getSupabaseAnonClient } from "@/lib/supabase-browser";

/** DB `edition_sections.section_key` → UI keys used by mock/components. */
const SECTION_KEY_TO_UI: Record<string, EditionSectionKey> = {
  global_ai: "global-ai",
  tool_radar: "tool-radar",
  builder: "builder",
  budapest: "budapest",
  weekend: "weekend",
  partner: "partner",
};

function mapSectionKey(raw: string): EditionSectionKey {
  return SECTION_KEY_TO_UI[raw] ?? "builder";
}

type DbEditionRow = {
  id: string;
  slug: string;
  number: number;
  title: string;
  description: string | null;
  intro: string | null;
  tags: string[] | null;
  edition_date: string | null;
  published_at: string | null;
  edition_sections:
    | {
        id: string;
        section_key: string;
        title: string;
        body: string | null;
        sort_order: number | null;
        edition_items:
          | {
              id: string;
              title: string;
              summary: string | null;
              source_label: string | null;
              url: string | null;
              sort_order: number | null;
            }[]
          | null;
      }[]
    | null;
};

function sortNum(a: number | null | undefined, b: number | null | undefined): number {
  return (a ?? 0) - (b ?? 0);
}

function mapDbEdition(row: DbEditionRow): Edition {
  const sectionsRaw = [...(row.edition_sections ?? [])].sort((a, b) =>
    sortNum(a.sort_order, b.sort_order),
  );

  const sections: EditionSectionView[] = sectionsRaw.map((sec) => {
    const itemsRaw = [...(sec.edition_items ?? [])].sort((a, b) =>
      sortNum(a.sort_order, b.sort_order),
    );
    const items: EditionItemView[] = itemsRaw.map((it) => ({
      id: it.id,
      title: it.title,
      summary: it.summary ?? "",
      source: it.source_label ?? undefined,
      url: it.url ?? undefined,
    }));
    return {
      key: mapSectionKey(sec.section_key),
      title: sec.title,
      body: sec.body,
      items,
    };
  });

  const date =
    row.edition_date ??
    (row.published_at ? row.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10));

  return {
    slug: row.slug,
    number: row.number,
    title: row.title,
    description: row.description ?? "",
    intro: row.intro ?? "",
    tags: row.tags ?? [],
    sections,
    date,
    publishedAt: row.published_at,
  };
}

const editionSelect = `
  id,
  slug,
  number,
  title,
  description,
  intro,
  tags,
  edition_date,
  published_at,
  edition_sections (
    id,
    section_key,
    title,
    body,
    sort_order,
    edition_items (
      id,
      title,
      summary,
      source_label,
      url,
      sort_order
    )
  )
`;

export async function fetchPublishedEditionsForArchive(): Promise<Edition[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("editions")
    .select(editionSelect)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("fetchPublishedEditionsForArchive", error.message);
    throw new Error(error.message);
  }

  return (data as DbEditionRow[]).map(mapDbEdition);
}

export async function fetchPublishedEditionBySlug(slug: string): Promise<Edition | null> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("editions")
    .select(editionSelect)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("fetchPublishedEditionBySlug", error.message);
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapDbEdition(data as DbEditionRow);
}

export type SitemapEdition = { slug: string; published_at: string | null };

export async function fetchPublishedEditionSlugs(): Promise<SitemapEdition[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("editions")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("fetchPublishedEditionSlugs", error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as SitemapEdition[];
}
