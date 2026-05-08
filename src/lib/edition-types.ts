export type EditionSectionKey =
  | "global-ai"
  | "tool-radar"
  | "builder"
  | "budapest"
  | "weekend"
  | "partner";

export type EditionItemView = {
  id?: string;
  title: string;
  summary: string;
  source?: string;
  url?: string;
};

export type EditionSectionView = {
  key: EditionSectionKey;
  title: string;
  body?: string | null;
  items: EditionItemView[];
};

export type Edition = {
  slug: string;
  number: number;
  title: string;
  date: string;
  description: string;
  tags: string[];
  intro: string;
  sections: EditionSectionView[];
  /** ISO datetime when published (SEO / JSON-LD). */
  publishedAt?: string | null;
};
