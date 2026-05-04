import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML returned by HN APIs (Firebase `text`, Algolia `comment_text` /
 * `story_text`). HN allows a narrow set of tags — we restrict to those.
 */
export function sanitizeHnHtml(html: string | undefined | null): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "a", "i", "em", "b", "strong", "code", "pre", "br"],
    ALLOWED_ATTR: ["href", "title", "rel", "target"],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}
