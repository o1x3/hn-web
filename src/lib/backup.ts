"use client";

import type {
  BookmarkRecord,
  HighlightRecord,
  HistoryRecord,
  PrefRecord,
  StoreName,
  VisitRecord,
} from "@/lib/idb/schema";
import { idbBulkPut, idbClear, idbGetAll, notifyStore } from "@/lib/idb/use-store";
import { z } from "zod";

const BACKUP_VERSION = 1;
const SETTINGS_COOKIE = "hnr-settings";

const BookmarkSchema = z.object({
  id: z.string(),
  kind: z.enum(["story", "comment", "user", "highlight"]),
  refId: z.string(),
  payload: z.record(z.unknown()),
  createdAt: z.number(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
});
const VisitSchema = z.object({
  storyId: z.number(),
  lastVisitedAt: z.number(),
  lastTopComment: z.number().optional(),
  lastSeenComments: z.array(z.number()),
});
const HistorySchema = z.object({
  id: z.string(),
  kind: z.enum(["story", "user"]),
  refId: z.string(),
  title: z.string().optional(),
  visitedAt: z.number(),
});
const HighlightSchema = z.object({
  id: z.string(),
  storyId: z.number(),
  commentId: z.number().optional(),
  anchor: z.object({
    text: z.string(),
    charOffset: z.number(),
    contextHashBefore: z.string(),
    contextHashAfter: z.string(),
  }),
  color: z.enum(["yellow", "orange", "pink"]),
  createdAt: z.number(),
});
// `z.unknown()` produces an optional property in TS; force it required so
// the inferred type matches `PrefRecord` exactly.
const PrefSchema: z.ZodType<{ key: string; value: unknown }> = z.object({
  key: z.string(),
  value: z.unknown(),
}) as z.ZodType<{ key: string; value: unknown }>;

export const BackupSchema = z.object({
  version: z.number(),
  exportedAt: z.number(),
  bookmarks: z.array(BookmarkSchema),
  visits: z.array(VisitSchema),
  history: z.array(HistorySchema),
  highlights: z.array(HighlightSchema),
  prefs: z.array(PrefSchema),
  settings: z.string().optional(),
});

export type Backup = z.infer<typeof BackupSchema>;

export async function exportAll(): Promise<Backup> {
  const [bookmarks, visits, history, highlights, prefs] = await Promise.all([
    idbGetAll("bookmarks"),
    idbGetAll("visits"),
    idbGetAll("history"),
    idbGetAll("highlights"),
    idbGetAll("prefs"),
  ]);
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    bookmarks: bookmarks as BookmarkRecord[],
    visits: visits as VisitRecord[],
    history: history as HistoryRecord[],
    highlights: highlights as HighlightRecord[],
    prefs: prefs as PrefRecord[],
    settings: readSettingsCookie() ?? undefined,
  };
}

export async function importAll(
  json: unknown,
  mode: "merge" | "replace",
): Promise<{ counts: Partial<Record<StoreName, number>> }> {
  const parsed = BackupSchema.parse(json);
  if (parsed.version > BACKUP_VERSION) {
    throw new Error(`Backup is from a newer version (${parsed.version})`);
  }

  if (mode === "replace") {
    await Promise.all([
      idbClear("bookmarks"),
      idbClear("visits"),
      idbClear("history"),
      idbClear("highlights"),
      idbClear("prefs"),
    ]);
  }

  await idbBulkPut("bookmarks", parsed.bookmarks);
  await idbBulkPut("visits", parsed.visits);
  await idbBulkPut("history", parsed.history);
  await idbBulkPut("highlights", parsed.highlights);
  await idbBulkPut("prefs", parsed.prefs);

  if (parsed.settings) {
    document.cookie = `${SETTINGS_COOKIE}=${encodeURIComponent(parsed.settings)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  for (const s of ["bookmarks", "visits", "history", "highlights", "prefs"] as StoreName[]) {
    notifyStore(s);
  }

  return {
    counts: {
      bookmarks: parsed.bookmarks.length,
      visits: parsed.visits.length,
      history: parsed.history.length,
      highlights: parsed.highlights.length,
      prefs: parsed.prefs.length,
    },
  };
}

export async function wipeAll(): Promise<void> {
  await Promise.all([
    idbClear("bookmarks"),
    idbClear("visits"),
    idbClear("history"),
    idbClear("highlights"),
    idbClear("prefs"),
  ]);
  for (const s of ["bookmarks", "visits", "history", "highlights", "prefs"] as StoreName[]) {
    notifyStore(s);
  }
}

export async function getStorageUsage(): Promise<{
  bookmarks: number;
  visits: number;
  history: number;
  highlights: number;
  prefs: number;
  bytes?: number;
  quota?: number;
}> {
  const [bookmarks, visits, history, highlights, prefs] = await Promise.all([
    idbGetAll("bookmarks"),
    idbGetAll("visits"),
    idbGetAll("history"),
    idbGetAll("highlights"),
    idbGetAll("prefs"),
  ]);
  let bytes: number | undefined;
  let quota: number | undefined;
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      bytes = est.usage;
      quota = est.quota;
    } catch {
      // ignore
    }
  }
  return {
    bookmarks: bookmarks.length,
    visits: visits.length,
    history: history.length,
    highlights: highlights.length,
    prefs: prefs.length,
    bytes,
    quota,
  };
}

function readSettingsCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`${SETTINGS_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
