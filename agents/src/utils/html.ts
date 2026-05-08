/**
 * Strip tags for rough plain-text context (OpenAI input). Not a full HTML parser.
 */
export function stripHtmlToText(html: string, maxChars = 14_000): string {
  const noScript = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  const text = noScript.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, maxChars);
}
