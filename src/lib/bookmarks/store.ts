"use client";

import type { BookmarkKind, BookmarkRecord } from "@/lib/idb/schema";
import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
  notifyStore,
  useAll,
  useByIndex,
} from "@/lib/idb/use-store";
import { uuid } from "@/lib/uuid";

export interface SaveStoryArgs {
  storyId: number;
  title?: string;
  url?: string;
  by?: string;
  time?: number;
  score?: number;
  descendants?: number;
  tags?: string[];
  note?: string;
}

export interface SaveCommentArgs {
  commentId: number;
  storyId?: number;
  author?: string;
  textHtml?: string;
  time?: number;
  permalink: string;
  tags?: string[];
  note?: string;
}

export interface SaveUserArgs {
  username: string;
  karma?: number;
  createdAt?: number;
  tags?: string[];
  note?: string;
}

/** Generic factory used by F1 + F3. */
function newBookmark(
  kind: BookmarkKind,
  refId: string,
  payload: Record<string, unknown>,
  opts?: { tags?: string[]; note?: string },
): BookmarkRecord {
  return {
    id: uuid(),
    kind,
    refId,
    payload,
    createdAt: Date.now(),
    tags: opts?.tags,
    note: opts?.note,
  };
}

export async function saveStory(a: SaveStoryArgs): Promise<BookmarkRecord> {
  const existing = await getByTarget("story", String(a.storyId));
  if (existing) return existing;
  const rec = newBookmark(
    "story",
    String(a.storyId),
    {
      storyId: a.storyId,
      title: a.title,
      url: a.url,
      by: a.by,
      time: a.time,
      score: a.score,
      descendants: a.descendants,
    },
    { tags: a.tags, note: a.note },
  );
  await idbPut("bookmarks", rec);
  return rec;
}

export async function saveComment(a: SaveCommentArgs): Promise<BookmarkRecord> {
  const existing = await getByTarget("comment", String(a.commentId));
  if (existing) return existing;
  const snippet = a.textHtml ? stripTags(a.textHtml).slice(0, 200) : "";
  const rec = newBookmark(
    "comment",
    String(a.commentId),
    {
      commentId: a.commentId,
      storyId: a.storyId,
      author: a.author,
      snippet,
      time: a.time,
      permalink: a.permalink,
    },
    { tags: a.tags, note: a.note },
  );
  await idbPut("bookmarks", rec);
  return rec;
}

export async function saveUser(a: SaveUserArgs): Promise<BookmarkRecord> {
  const existing = await getByTarget("user", a.username);
  if (existing) return existing;
  const rec = newBookmark(
    "user",
    a.username,
    {
      username: a.username,
      karma: a.karma,
      createdAt: a.createdAt,
    },
    { tags: a.tags, note: a.note },
  );
  await idbPut("bookmarks", rec);
  return rec;
}

/** F3 calls this with the highlight id as refId so they're linkable. */
export async function saveHighlight(args: {
  highlightId: string;
  storyId: number;
  commentId?: number;
  text: string;
  color: string;
}): Promise<BookmarkRecord> {
  const rec = newBookmark("highlight", args.highlightId, {
    highlightId: args.highlightId,
    storyId: args.storyId,
    commentId: args.commentId,
    text: args.text,
    color: args.color,
  });
  await idbPut("bookmarks", rec);
  return rec;
}

export async function getByTarget(
  kind: BookmarkKind,
  refId: string,
): Promise<BookmarkRecord | null> {
  // Linear scan filtered to the by-refId index. refId is already indexed but
  // not unique across kinds, so post-filter on kind.
  const all = await idbGetAll("bookmarks");
  return all.find((b) => b.kind === kind && b.refId === refId) ?? null;
}

export async function removeBookmark(id: string): Promise<void> {
  await idbDelete("bookmarks", id);
}

export async function removeByTarget(kind: BookmarkKind, refId: string): Promise<void> {
  const existing = await getByTarget(kind, refId);
  if (existing) await removeBookmark(existing.id);
}

export async function updateBookmark(id: string, patch: Partial<BookmarkRecord>): Promise<void> {
  const cur = await idbGet("bookmarks", id);
  if (!cur) return;
  await idbPut("bookmarks", { ...cur, ...patch, id: cur.id });
}

export async function clearBookmarks(): Promise<void> {
  // Used by /settings wipe; uses idbClear via store hook.
  const all = await idbGetAll("bookmarks");
  for (const b of all) {
    await idbDelete("bookmarks", b.id);
  }
  notifyStore("bookmarks");
}

/** Hook wrappers. */
export function useBookmarks() {
  return useAll("bookmarks");
}

export function useBookmarksByKind(kind: BookmarkKind) {
  return useByIndex("bookmarks", "by-kind", kind);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
