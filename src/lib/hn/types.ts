/** Raw Firebase item shape. */
export interface RawItem {
  id: number;
  deleted?: boolean;
  type?: "story" | "comment" | "job" | "poll" | "pollopt";
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

/** Raw Firebase user shape. */
export interface RawUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

/** Algolia tree node returned by /items/<id>. */
export interface AlgoliaTreeNode {
  id: number;
  created_at?: string;
  created_at_i?: number;
  type?: string;
  author?: string | null;
  title?: string | null;
  url?: string | null;
  text?: string | null;
  story_text?: string | null;
  comment_text?: string | null;
  points?: number | null;
  parent_id?: number | null;
  story_id?: number | null;
  children?: AlgoliaTreeNode[];
  options?: unknown[];
}

/** Algolia search hit. */
export interface AlgoliaHit {
  objectID: string;
  title?: string;
  url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  story_text?: string;
  comment_text?: string;
  story_id?: number;
  story_title?: string;
  parent_id?: number;
  created_at_i: number;
  _tags?: string[];
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaHit[];
  page: number;
  nbHits: number;
  nbPages: number;
  hitsPerPage: number;
}

/** Friendly normalized comment for UI. */
export interface CommentNode {
  id: number;
  author: string | null;
  textHtml: string;
  createdAt: number; // unix seconds
  dead: boolean;
  deleted: boolean;
  children: CommentNode[];
}

/** List kinds accepted by /v0/{kind}stories.json. */
export type ListKind = "top" | "new" | "best" | "ask" | "show" | "job";

/** Internal cache key helpers. */
export const cacheKeys = {
  list: (kind: ListKind) => `list:${kind}`,
  item: (id: number) => `item:${id}`,
  itemTree: (id: number) => `tree:${id}`,
  user: (id: string) => `user:${id}`,
  algoliaSearch: (q: string, opts: string) => `search:${q}:${opts}`,
};
