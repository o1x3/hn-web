import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "a", "i", "em", "b", "strong", "code", "pre", "br"],
  allowedAttributes: { a: ["href", "title", "rel", "target"] },
  allowedSchemes: ["http", "https", "mailto"],
  disallowedTagsMode: "discard",
};

/**
 * Sanitize HTML returned by HN APIs (Firebase `text`, Algolia `comment_text` /
 * `story_text`). HN allows a narrow set of tags — we restrict to those.
 */
export function sanitizeHnHtml(html: string | undefined | null): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
