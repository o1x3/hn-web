/**
 * HTML scrapers for `news.ycombinator.com` write flows.
 *
 * The official Firebase API is read-only, so any write action (login, vote,
 * favorite, comment, submit) requires submitting a form to HN. Each form has a
 * short-lived per-page CSRF token that we must scrape from the HTML
 * immediately before the action — never cache.
 *
 *   - Vote: `auth=` query param on the upvote/unvote `<a>`'s href.
 *   - Comment: `<input name="hmac">` on the reply form.
 *   - Submit: `<input name="fnid">` and `<input name="fnop">` on /submit.
 *
 * Personalized pages (/threads, /favorites, /upvoted, /submitted) are
 * HTML-only; we parse them into a list of items with a per-page selector.
 *
 * FRAGILE: any layout change on news.ycombinator.com breaks these selectors.
 * Re-verify when surface acts up; fixtures live in /test/fixtures.
 */

import { parseHTML } from "linkedom";

/** Extract the `auth` token for a given item id from a page's HTML. */
export function extractVoteAuth(html: string, itemId: number): string | null {
  const { document } = parseHTML(html);
  const sel = `#up_${itemId}`;
  const el = document.querySelector<HTMLAnchorElement>(sel);
  if (!el) return null;
  const href = el.getAttribute("href") ?? "";
  const m = href.match(/[?&]auth=([^&]+)/);
  return m?.[1] ?? null;
}

/** Extract the `hmac` token from a comment / reply form on a page. */
export function extractCommentHmac(html: string): string | null {
  const { document } = parseHTML(html);
  const input = document.querySelector<HTMLInputElement>('input[name="hmac"]');
  return input?.getAttribute("value") ?? null;
}

/** Extract `fnid` and `fnop` from /submit. Both are required to POST a story. */
export function extractSubmitFormTokens(html: string): { fnid: string; fnop: string } | null {
  const { document } = parseHTML(html);
  const fnid = document.querySelector<HTMLInputElement>('input[name="fnid"]');
  const fnop = document.querySelector<HTMLInputElement>('input[name="fnop"]');
  if (!fnid || !fnop) return null;
  const fnidV = fnid.getAttribute("value");
  const fnopV = fnop.getAttribute("value");
  if (!fnidV || !fnopV) return null;
  return { fnid: fnidV, fnop: fnopV };
}

/**
 * Detect logged-in state from a fetched HN page. HN silently degrades to
 * logged-out HTML when a session expires; we look for the logout link.
 */
export function isLoggedIn(html: string): boolean {
  return /<a [^>]*href="logout\?[^"]*"/.test(html);
}

/** Detect HN's "Bad login" page (returned with HTTP 200). */
export function isBadLogin(html: string): boolean {
  return /Bad login\./i.test(html);
}

/** Parsed row from /threads, /submitted, /favorites, /upvoted. */
export interface PersonalizedRow {
  id: number;
  title: string | null;
  url: string | null;
  author: string | null;
  score: number | null;
  /** "comment" rows have text; "story" rows have title+url. */
  text: string | null;
  type: "story" | "comment";
  ageText: string | null;
  commentCount: number | null;
}

/**
 * Parse one of the personalized HTML pages into rows.
 *
 * /threads renders comments by the user; the others render stories. We detect
 * by presence of `.athing.comtr` (comment row) vs `.athing` with a `.titleline`
 * (story row).
 */
export function parsePersonalizedPage(html: string): PersonalizedRow[] {
  const { document } = parseHTML(html);
  const rows: PersonalizedRow[] = [];

  // Story rows: `<tr class="athing">` with subsequent metadata `<tr>`.
  const stories = document.querySelectorAll<HTMLTableRowElement>("tr.athing:not(.comtr)");
  for (const tr of stories) {
    const id = Number(tr.getAttribute("id"));
    if (!Number.isFinite(id)) continue;
    const title = tr.querySelector(".titleline > a")?.textContent ?? null;
    const url =
      (tr.querySelector(".titleline > a") as HTMLAnchorElement | null)?.getAttribute("href") ??
      null;
    const meta = tr.nextElementSibling;
    const score = Number(meta?.querySelector(".score")?.textContent?.replace(/[^\d]/g, "") ?? "");
    const author = meta?.querySelector(".hnuser")?.textContent ?? null;
    const ageText = meta?.querySelector(".age")?.textContent ?? null;
    const cmtAnchor = meta?.querySelectorAll(".subtext a");
    const last = cmtAnchor?.[cmtAnchor.length - 1] as HTMLAnchorElement | null;
    const cmtText = last?.textContent ?? "";
    const commentCount = /comment/.test(cmtText) ? Number(cmtText.replace(/[^\d]/g, "")) : null;
    rows.push({
      id,
      type: "story",
      title,
      url,
      author,
      score: Number.isFinite(score) ? score : null,
      text: null,
      ageText,
      commentCount,
    });
  }

  // Comment rows: `<tr class="athing comtr">` (used on /threads).
  const comments = document.querySelectorAll<HTMLTableRowElement>("tr.athing.comtr");
  for (const tr of comments) {
    const id = Number(tr.getAttribute("id"));
    if (!Number.isFinite(id)) continue;
    const author = tr.querySelector(".hnuser")?.textContent ?? null;
    const ageText = tr.querySelector(".age")?.textContent ?? null;
    const commentEl = tr.querySelector(".commtext");
    const text = commentEl?.innerHTML ?? null;
    rows.push({
      id,
      type: "comment",
      title: null,
      url: null,
      author,
      score: null,
      text,
      ageText,
      commentCount: null,
    });
  }

  return rows;
}
