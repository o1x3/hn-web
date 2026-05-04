/**
 * Parser for HN-flavored text (the input to comment / submit textareas).
 *
 * HN renders only:
 *   - Paragraphs split on blank lines
 *   - *italic*
 *   - Lines starting with two spaces → code block (verbatim)
 *   - http/https URLs → autolinks
 *
 * Returns an AST that `<HnFlavoredText>` renders. The same AST is used in the
 * live-preview pane so the user sees what HN will render.
 *
 * FRAGILE: HN's exact rendering rules are observed empirically (no spec). Some
 * edge cases — nested *, asterisks inside URLs, code blocks with mixed
 * indentation — may diverge from HN. Add fixtures as we find them.
 */

export type HnNode =
  | { type: "paragraph"; children: HnInline[] }
  | { type: "code"; text: string };

export type HnInline =
  | { type: "text"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; href: string; value: string };

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+[^\s<>"')\.,;:!?]/g;
const ITALIC_RE = /\*([^*\n]+)\*/g;

export function parseHnText(input: string): HnNode[] {
  if (!input) return [];
  // Normalize line endings.
  const text = input.replace(/\r\n?/g, "\n").trimEnd();
  // Split on one or more blank lines.
  const blocks = text.split(/\n{2,}/);
  const nodes: HnNode[] = [];
  for (const raw of blocks) {
    if (!raw.trim()) continue;
    const lines = raw.split("\n");
    if (lines.every((l) => l.startsWith("  "))) {
      nodes.push({ type: "code", text: lines.map((l) => l.slice(2)).join("\n") });
    } else {
      nodes.push({ type: "paragraph", children: parseInlines(raw) });
    }
  }
  return nodes;
}

function parseInlines(s: string): HnInline[] {
  // First pass: extract URLs into link nodes; remaining text is parsed for italics.
  const urlMatches: { start: number; end: number; href: string }[] = [];
  for (const m of s.matchAll(URL_RE)) {
    if (m.index !== undefined) {
      urlMatches.push({ start: m.index, end: m.index + m[0].length, href: m[0] });
    }
  }

  const out: HnInline[] = [];
  let cursor = 0;
  for (const u of urlMatches) {
    if (u.start > cursor) out.push(...italicize(s.slice(cursor, u.start)));
    out.push({ type: "link", href: u.href, value: u.href });
    cursor = u.end;
  }
  if (cursor < s.length) out.push(...italicize(s.slice(cursor)));
  return out;
}

function italicize(s: string): HnInline[] {
  const out: HnInline[] = [];
  let last = 0;
  for (const m of s.matchAll(ITALIC_RE)) {
    if (m.index === undefined) continue;
    if (m.index > last) out.push({ type: "text", value: s.slice(last, m.index) });
    out.push({ type: "italic", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ type: "text", value: s.slice(last) });
  return out;
}
