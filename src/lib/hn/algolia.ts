import { TTL, cached } from "@/lib/cache";
import { hnFetchJson } from "@/lib/fetcher";
import { type AlgoliaSearchResponse, type AlgoliaTreeNode, cacheKeys } from "@/lib/hn/types";

const BASE = "https://hn.algolia.com/api/v1";

export interface SearchOpts {
  query?: string;
  /** "story" | "comment" | "ask_hn" | "show_hn" | "job" | "poll" | "front_page" | "author_<u>" | "story_<id>" */
  tags?: string[];
  /** Numeric filters like ["points>50", "created_at_i>1700000000"]. */
  numericFilters?: string[];
  page?: number;
  hitsPerPage?: number;
  /** byDate=true sorts newest-first, otherwise relevance/points. */
  byDate?: boolean;
}

export async function search(opts: SearchOpts): Promise<AlgoliaSearchResponse> {
  const params = new URLSearchParams();
  if (opts.query) params.set("query", opts.query);
  if (opts.tags?.length) params.set("tags", opts.tags.join(","));
  if (opts.numericFilters?.length) params.set("numericFilters", opts.numericFilters.join(","));
  params.set("page", String(opts.page ?? 0));
  params.set("hitsPerPage", String(opts.hitsPerPage ?? 30));

  const path = opts.byDate ? "search_by_date" : "search";
  const url = `${BASE}/${path}?${params.toString()}`;
  const cacheKey = cacheKeys.algoliaSearch(opts.query ?? "", url);
  return cached(cacheKey, TTL.search, () => hnFetchJson<AlgoliaSearchResponse>(url));
}

/**
 * Fetch the full nested comment tree for a story in one request.
 * This is the single biggest performance win — replaces a Firebase fan-out.
 *
 * FRAGILE: returns 404 for items not yet indexed (typically < a few minutes
 * old). Caller should fall back to firebase.fanoutCommentTree on 404.
 */
export async function getItemTree(id: number): Promise<AlgoliaTreeNode | null> {
  return cached(cacheKeys.itemTree(id), TTL.item, async () => {
    try {
      return await hnFetchJson<AlgoliaTreeNode>(`${BASE}/items/${id}`);
    } catch (err) {
      if (err instanceof Error && /\b404\b/.test(err.message)) return null;
      throw err;
    }
  });
}

/** User lookup via Algolia. */
export async function getAlgoliaUser(username: string): Promise<{
  username: string;
  karma?: number;
  about?: string;
  created_at_i?: number;
} | null> {
  try {
    return await hnFetchJson(`${BASE}/users/${username}`);
  } catch {
    return null;
  }
}

/** Recent items by an author (for hover card + user activity). */
export async function getUserActivity(username: string, hitsPerPage = 50) {
  return search({
    tags: [`author_${username}`],
    byDate: true,
    hitsPerPage,
  });
}
