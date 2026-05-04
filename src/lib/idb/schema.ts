import type { DBSchema } from "idb";

export const DB_NAME = "hn-client";
export const DB_VERSION = 1;

export type BookmarkKind = "story" | "comment" | "user" | "highlight";

export interface BookmarkRecord {
  /** UUID v4 string. */
  id: string;
  kind: BookmarkKind;
  /** HN id (story/comment) or username; for highlights, the highlight id. */
  refId: string;
  payload: Record<string, unknown>;
  createdAt: number;
  tags?: string[];
  note?: string;
}

export interface VisitRecord {
  storyId: number;
  lastVisitedAt: number;
  lastTopComment?: number;
  /** Capped at 5000 ids; oldest truncated. */
  lastSeenComments: number[];
}

export type HistoryKind = "story" | "user";

export interface HistoryRecord {
  /** `${kind}:${refId}:${visitedAt}` to allow many visits per ref. */
  id: string;
  kind: HistoryKind;
  refId: string;
  title?: string;
  visitedAt: number;
}

export type HighlightColor = "yellow" | "orange" | "pink";

export interface HighlightRecord {
  id: string;
  storyId: number;
  commentId?: number;
  anchor: {
    text: string;
    /** Index into the comment text where this highlight starts. */
    charOffset: number;
    /** 16 chars before/after for fuzzy re-locate. */
    contextHashBefore: string;
    contextHashAfter: string;
  };
  color: HighlightColor;
  createdAt: number;
}

export interface PrefRecord {
  key: string;
  value: unknown;
}

export interface HnSchema extends DBSchema {
  bookmarks: {
    key: string;
    value: BookmarkRecord;
    indexes: {
      "by-kind": BookmarkKind;
      "by-createdAt": number;
      "by-refId": string;
      "by-tags": string;
    };
  };
  visits: {
    key: number;
    value: VisitRecord;
    indexes: { "by-lastVisitedAt": number };
  };
  history: {
    key: string;
    value: HistoryRecord;
    indexes: {
      "by-visitedAt": number;
      "by-kind": HistoryKind;
      "by-refId": string;
    };
  };
  highlights: {
    key: string;
    value: HighlightRecord;
    indexes: {
      "by-storyId": number;
      "by-commentId": number;
      "by-createdAt": number;
    };
  };
  prefs: {
    key: string;
    value: PrefRecord;
  };
}

/**
 * Explicit literal union (vs `keyof HnSchema`) so it resolves to the narrow
 * string-literal type in dependents — `idb`'s overloads reject the wider
 * `string | number | symbol` shape that `keyof DBSchema` produces.
 */
export type StoreName = "bookmarks" | "visits" | "history" | "highlights" | "prefs";
