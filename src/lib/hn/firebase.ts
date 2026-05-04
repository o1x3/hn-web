import { TTL, cached } from "@/lib/cache";
import { hnFetchJson } from "@/lib/fetcher";
import { type ListKind, type RawItem, type RawUser, cacheKeys } from "@/lib/hn/types";

const BASE = "https://hacker-news.firebaseio.com/v0";

const LIST_PATHS: Record<ListKind, string> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  job: "jobstories",
};

/** Fetch the ID list for a section (up to 500 for top/new/best, 200 for ask/show/job). */
export async function getList(kind: ListKind): Promise<number[]> {
  return cached(cacheKeys.list(kind), TTL.list, () =>
    hnFetchJson<number[]>(`${BASE}/${LIST_PATHS[kind]}.json`),
  );
}

/** Fetch a single item by id. Returns null on 404 or item == null. */
export async function getItem(id: number): Promise<RawItem | null> {
  return cached(cacheKeys.item(id), TTL.item, async () => {
    const v = await hnFetchJson<RawItem | null>(`${BASE}/item/${id}.json`);
    return v ?? null;
  });
}

/** Batch-fetch items in parallel. Skips null/dead/deleted unless includeFiltered=true. */
export async function batchItems(
  ids: number[],
  opts: { includeFiltered?: boolean } = {},
): Promise<RawItem[]> {
  const results = await Promise.all(ids.map((id) => getItem(id).catch(() => null)));
  return results.filter((it): it is RawItem => {
    if (!it) return false;
    if (opts.includeFiltered) return true;
    if (it.deleted || it.dead) return false;
    return true;
  });
}

/** Fetch a user profile (only users with public activity exist). */
export async function getUser(id: string): Promise<RawUser | null> {
  return cached(cacheKeys.user(id), TTL.user, async () => {
    const v = await hnFetchJson<RawUser | null>(`${BASE}/user/${id}.json`);
    return v ?? null;
  });
}

/** Current largest item ID; can walk backwards if needed. */
export async function getMaxItem(): Promise<number> {
  return hnFetchJson<number>(`${BASE}/maxitem.json`);
}

/** Recently changed items + profiles. Useful for cache invalidation. */
export async function getUpdates(): Promise<{ items: number[]; profiles: string[] }> {
  return hnFetchJson(`${BASE}/updates.json`);
}

/**
 * FALLBACK ONLY. Recursively fetch a comment tree from Firebase. This is N+1
 * and slow for big threads — prefer Algolia.getItemTree. Used only when
 * Algolia 404s on a freshly-posted item.
 */
export async function fanoutCommentTree(
  rootId: number,
  maxDepth = 6,
): Promise<RawItem[]> {
  const visited = new Set<number>();
  const out: RawItem[] = [];

  async function walk(id: number, depth: number) {
    if (depth > maxDepth || visited.has(id)) return;
    visited.add(id);
    const it = await getItem(id);
    if (!it) return;
    out.push(it);
    if (it.kids?.length) {
      await Promise.all(it.kids.map((k) => walk(k, depth + 1)));
    }
  }
  await walk(rootId, 0);
  return out;
}
