import { getItemTree, search } from "@/lib/hn/algolia";
import type { AlgoliaTreeNode } from "@/lib/hn/types";

export interface ReplyItem {
  /** Reply comment id. */
  id: number;
  author: string;
  textHtml: string;
  /** Unix seconds (Algolia's native unit). */
  createdAt: number;
  /** The id of *my* comment they replied to. */
  parentId: number;
  parentTextSnippet: string;
  storyId: number;
  storyTitle: string;
}

const PARENT_FETCH_CONCURRENCY = 6;
const MAX_PARENTS = 50;
const SNIPPET_LEN = 140;

/**
 * Find replies addressed to `username` since `since` (unix ms).
 *
 * Strategy: pull my recent comments from Algolia, then for each comment
 * fetch the Algolia tree to enumerate its direct children. Children whose
 * author is not me and whose `created_at_i` is past `since` are the replies.
 *
 * Limits: only the most recent 50 of my comments are scanned, so a reply
 * landing on an older comment of mine is missed. Acceptable for v1.
 */
export async function getRepliesForUser(username: string, sinceMs: number): Promise<ReplyItem[]> {
  if (!username) return [];
  const sinceS = Math.floor(sinceMs / 1000);

  const mine = await search({
    tags: ["comment", `author_${username}`],
    byDate: true,
    hitsPerPage: MAX_PARENTS,
  });

  const parentIds = mine.hits.map((h) => Number(h.objectID)).filter((n) => Number.isFinite(n));
  if (parentIds.length === 0) return [];

  const trees = await pMap(parentIds, PARENT_FETCH_CONCURRENCY, (id) =>
    getItemTree(id).catch(() => null),
  );

  const replies: ReplyItem[] = [];
  for (const tree of trees) {
    if (!tree) continue;
    const parentSnippet = textSnippet(commentText(tree), SNIPPET_LEN);
    const storyId = tree.story_id ?? tree.id;
    const storyTitle = tree.title ?? "";
    for (const child of tree.children ?? []) {
      if (!child.author || child.author === username) continue;
      const t = child.created_at_i;
      if (typeof t !== "number" || t <= sinceS) continue;
      replies.push({
        id: child.id,
        author: child.author,
        textHtml: commentText(child),
        createdAt: t,
        parentId: tree.id,
        parentTextSnippet: parentSnippet,
        storyId,
        storyTitle,
      });
    }
  }

  replies.sort((a, b) => b.createdAt - a.createdAt);
  return replies;
}

function commentText(n: AlgoliaTreeNode): string {
  return n.text ?? n.comment_text ?? "";
}

function textSnippet(html: string, max: number): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/** Concurrency-limited async map. Inline to avoid a dep. */
async function pMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export const __test = { pMap, textSnippet };
