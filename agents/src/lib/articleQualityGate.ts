export type ArticleQualityInput = {
  title: string;
  excerpt: string | null;
  bodyMarkdown: string;
  seoTitle: string | null;
  seoDescription: string | null;
  keywords: string[] | null;
};

export type ArticleQualityReport = {
  passed: boolean;
  score: number;
  issues: string[];
  hardFails: string[];
  warnings: string[];
};

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function headingCount(md: string): number {
  return md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("## ") || l.startsWith("### ")).length;
}

export function evaluateArticleQuality(input: ArticleQualityInput): ArticleQualityReport {
  const hardFails: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  const titleLen = input.title.trim().length;
  if (titleLen < 25 || titleLen > 110) {
    warnings.push("Title length should be between 25 and 110 characters.");
    score -= 15;
  }

  const excerptLen = (input.excerpt ?? "").trim().length;
  if (excerptLen < 80) {
    warnings.push("Excerpt is too short (<80 chars).");
    score -= 8;
  }

  const words = wordCount(input.bodyMarkdown);
  if (words < 500) {
    hardFails.push("Body is too short (<500 words).");
    score -= 25;
  }

  const headings = headingCount(input.bodyMarkdown);
  if (headings < 2) {
    hardFails.push("Body should include at least 2 markdown headings (## / ###).");
    score -= 15;
  }

  const seoTitleLen = (input.seoTitle ?? "").trim().length;
  if (seoTitleLen === 0) {
    hardFails.push("SEO title is missing.");
    score -= 12;
  } else if (seoTitleLen < 20 || seoTitleLen > 70) {
    warnings.push("SEO title should be between 20 and 70 chars.");
    score -= 10;
  }

  const seoDescLen = (input.seoDescription ?? "").trim().length;
  if (seoDescLen === 0) {
    hardFails.push("SEO description is missing.");
    score -= 12;
  } else if (seoDescLen < 80 || seoDescLen > 180) {
    warnings.push("SEO description should be between 80 and 180 chars.");
    score -= 10;
  }

  const kwCount = (input.keywords ?? []).filter(Boolean).length;
  if (kwCount < 3) {
    warnings.push("At least 3 keywords recommended.");
    score -= 6;
  }

  const normalized = Math.max(0, Math.min(100, score));
  const issues = [...hardFails, ...warnings];
  return {
    passed: hardFails.length === 0 && normalized >= 70,
    score: normalized,
    issues,
    hardFails,
    warnings,
  };
}
