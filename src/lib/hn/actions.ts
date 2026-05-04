"use server";

/**
 * Server actions for HN write flows. Each action:
 *  1. Loads the user's encrypted session cookie.
 *  2. Checks per-session rate limit (1 write / 500 ms).
 *  3. Scrapes the relevant HN page to extract a fresh CSRF token.
 *  4. Issues the write request with the user's HN session cookie attached.
 *  5. Invalidates the affected cache key.
 *  6. Returns minimal new state for optimistic-UI to settle on.
 *
 * Tokens (`auth`, `hmac`, `fnid`, `fnop`) are NEVER exposed to the client.
 * Errors are normalized to the client as `{ ok: false, error: string }` so
 * UI can roll back optimistic state.
 */

import { getCache } from "@/lib/cache";
import { hnFetch, hnFetchText } from "@/lib/fetcher";
import {
  extractCommentHmac,
  extractSubmitFormTokens,
  extractVoteAuth,
  isLoggedIn,
} from "@/lib/hn/scrape";
import { cacheKeys } from "@/lib/hn/types";
import { checkWriteRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const HN = "https://news.ycombinator.com";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; needsLogin?: boolean };

async function authedHeaders(): Promise<
  { ok: true; headers: HeadersInit; username: string } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session.hnCookie || !session.username) {
    return { ok: false, error: "Not logged in" };
  }
  const rl = checkWriteRateLimit(session.username);
  if (!rl.ok) {
    return { ok: false, error: `Rate-limited; retry in ${rl.retryAfterMs}ms` };
  }
  return {
    ok: true,
    username: session.username,
    headers: { Cookie: `user=${session.hnCookie}` },
  };
}

async function fetchAuthedHtml(path: string, headers: HeadersInit): Promise<string> {
  return hnFetchText(`${HN}${path}`, { headers });
}

/** Vote on an item (story or comment). dir: "up" | "un" (undo) | "down". */
export async function voteAction(
  itemId: number,
  dir: "up" | "un" | "down" = "up",
): Promise<ActionResult<{ scored: true }>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };

  const html = await fetchAuthedHtml(`/item?id=${itemId}`, auth.headers);
  if (!isLoggedIn(html)) {
    const session = await getSession();
    await session.destroy();
    return { ok: false, error: "Session expired", needsLogin: true };
  }
  const token = extractVoteAuth(html, itemId);
  if (!token) {
    return { ok: false, error: "Could not find vote token (already voted?)" };
  }
  const url = `${HN}/vote?id=${itemId}&how=${dir}&auth=${encodeURIComponent(token)}&goto=item%3Fid%3D${itemId}`;
  const res = await hnFetch(url, { headers: auth.headers, redirect: "manual" });
  // HN returns 302 on success.
  if (res.status >= 400) {
    return { ok: false, error: `Vote failed (${res.status})` };
  }
  await getCache().invalidate(cacheKeys.item(itemId));
  return { ok: true, data: { scored: true } };
}

/** Favorite/unfavorite a story. */
export async function favoriteAction(
  itemId: number,
  on: boolean,
): Promise<ActionResult<{ on: boolean }>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };

  const html = await fetchAuthedHtml(`/item?id=${itemId}`, auth.headers);
  const token = extractVoteAuth(html, itemId);
  if (!token) return { ok: false, error: "Could not find auth token" };

  const url = `${HN}/fave?id=${itemId}&un=${on ? "" : "t"}&auth=${encodeURIComponent(token)}&goto=item%3Fid%3D${itemId}`;
  const res = await hnFetch(url, { headers: auth.headers, redirect: "manual" });
  if (res.status >= 400) return { ok: false, error: `Favorite failed (${res.status})` };
  await getCache().invalidate(cacheKeys.item(itemId));
  return { ok: true, data: { on } };
}

/** Hide a story. */
export async function hideAction(itemId: number): Promise<ActionResult<null>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };
  const html = await fetchAuthedHtml(`/item?id=${itemId}`, auth.headers);
  const token = extractVoteAuth(html, itemId);
  if (!token) return { ok: false, error: "Could not find auth token" };
  const url = `${HN}/hide?id=${itemId}&auth=${encodeURIComponent(token)}&goto=news`;
  const res = await hnFetch(url, { headers: auth.headers, redirect: "manual" });
  if (res.status >= 400) return { ok: false, error: `Hide failed (${res.status})` };
  return { ok: true, data: null };
}

/** Flag a story or comment. */
export async function flagAction(itemId: number): Promise<ActionResult<null>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };
  const html = await fetchAuthedHtml(`/item?id=${itemId}`, auth.headers);
  const token = extractVoteAuth(html, itemId);
  if (!token) return { ok: false, error: "Could not find auth token" };
  const url = `${HN}/flag?id=${itemId}&auth=${encodeURIComponent(token)}&goto=item%3Fid%3D${itemId}`;
  const res = await hnFetch(url, { headers: auth.headers, redirect: "manual" });
  if (res.status >= 400) return { ok: false, error: `Flag failed (${res.status})` };
  await getCache().invalidate(cacheKeys.item(itemId));
  return { ok: true, data: null };
}

/** Reply to a story or comment. */
export async function replyAction(
  parentId: number,
  text: string,
): Promise<ActionResult<{ posted: true }>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };
  if (!text.trim()) return { ok: false, error: "Comment text is empty" };

  const html = await fetchAuthedHtml(
    `/reply?id=${parentId}&goto=item%3Fid%3D${parentId}`,
    auth.headers,
  );
  const hmac = extractCommentHmac(html);
  if (!hmac) return { ok: false, error: "Could not find hmac token" };

  const body = new URLSearchParams({
    parent: String(parentId),
    goto: `item?id=${parentId}`,
    hmac,
    text,
  });
  const res = await hnFetch(`${HN}/comment`, {
    method: "POST",
    headers: {
      ...auth.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    redirect: "manual",
  });
  if (res.status >= 400) return { ok: false, error: `Reply failed (${res.status})` };
  await getCache().invalidate(cacheKeys.item(parentId));
  await getCache().invalidate(cacheKeys.itemTree(parentId));
  return { ok: true, data: { posted: true } };
}

/** Submit a story. Either url OR text must be set. */
export async function submitAction(
  title: string,
  url: string,
  text: string,
): Promise<ActionResult<{ posted: true }>> {
  const auth = await authedHeaders();
  if (!auth.ok) return { ok: false, error: auth.error, needsLogin: true };
  if (!title.trim()) return { ok: false, error: "Title required" };
  if (!url.trim() && !text.trim()) return { ok: false, error: "URL or text required" };

  const html = await fetchAuthedHtml("/submit", auth.headers);
  const tokens = extractSubmitFormTokens(html);
  if (!tokens) return { ok: false, error: "Could not find submit form tokens" };

  const body = new URLSearchParams({
    fnid: tokens.fnid,
    fnop: tokens.fnop,
    title,
    url,
    text,
  });
  const res = await hnFetch(`${HN}/r`, {
    method: "POST",
    headers: {
      ...auth.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    redirect: "manual",
  });
  if (res.status >= 400) return { ok: false, error: `Submit failed (${res.status})` };
  return { ok: true, data: { posted: true } };
}
