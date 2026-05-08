import type { Edition } from "@/lib/edition-types";
import type { Article } from "@/lib/article-types";
import { getOgImageAbsoluteUrl, getPublicSiteUrl } from "@/lib/public-env";

export function editionCanonicalUrl(slug: string): string {
  return `${getPublicSiteUrl()}/archive/${slug}`;
}

export function buildNewsArticleJsonLd(edition: Edition): Record<string, unknown> {
  const url = editionCanonicalUrl(edition.slug);
  const datePublished = edition.publishedAt ?? `${edition.date}T07:00:00+01:00`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: edition.title,
    description: edition.description || edition.intro.slice(0, 300),
    datePublished,
    dateModified: edition.publishedAt ?? datePublished,
    inLanguage: "hu-HU",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    publisher: {
      "@type": "Organization",
      name: "Budapest Signal",
      url: getPublicSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: getOgImageAbsoluteUrl(),
      },
    },
    image: [getOgImageAbsoluteUrl()],
    author: { "@type": "Organization", name: "Budapest Signal" },
  };
}

export function articleCanonicalUrl(slug: string): string {
  return `${getPublicSiteUrl()}/articles/${slug}`;
}

export function buildLongformArticleJsonLd(article: Article): Record<string, unknown> {
  const url = articleCanonicalUrl(article.slug);
  const datePublished = article.publishedAt ?? article.createdAt;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription || article.excerpt.slice(0, 300),
    datePublished,
    dateModified: article.publishedAt ?? article.createdAt,
    inLanguage: "hu-HU",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    publisher: {
      "@type": "Organization",
      name: "Budapest Signal",
      url: getPublicSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: getOgImageAbsoluteUrl(),
      },
    },
    image: [getOgImageAbsoluteUrl()],
    author: { "@type": "Organization", name: "Budapest Signal" },
    keywords: article.keywords,
  };
}
