/**
 * Validates the IDB schema substrate end-to-end against fake-indexeddb.
 * Re-runs migrations on a fresh DB and confirms reads/writes work for every
 * store + index defined in lib/idb/schema.ts.
 */
import "fake-indexeddb/auto";
import { __resetIdbCache, openHnDb } from "@/lib/idb/db";
import type {
  BookmarkRecord,
  HighlightRecord,
  HistoryRecord,
  PrefRecord,
  VisitRecord,
} from "@/lib/idb/schema";
import { afterEach, describe, expect, it } from "vitest";

afterEach(async () => {
  // Drop the singleton so each test starts with a fresh DB.
  await __resetIdbCache();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("hn-client");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

describe("IDB schema v1", () => {
  it("creates all five stores and their indexes", async () => {
    const db = await openHnDb();
    const names = Array.from(db.objectStoreNames).sort();
    expect(names).toEqual(["bookmarks", "highlights", "history", "prefs", "visits"]);

    const tx = db.transaction(["bookmarks", "visits", "history", "highlights"]);
    expect(Array.from(tx.objectStore("bookmarks").indexNames).sort()).toEqual([
      "by-createdAt",
      "by-kind",
      "by-refId",
      "by-tags",
    ]);
    expect(Array.from(tx.objectStore("visits").indexNames)).toEqual(["by-lastVisitedAt"]);
    expect(Array.from(tx.objectStore("history").indexNames).sort()).toEqual([
      "by-kind",
      "by-refId",
      "by-visitedAt",
    ]);
    expect(Array.from(tx.objectStore("highlights").indexNames).sort()).toEqual([
      "by-commentId",
      "by-createdAt",
      "by-storyId",
    ]);
  });

  it("round-trips a record per store", async () => {
    const db = await openHnDb();

    const bookmark: BookmarkRecord = {
      id: "b1",
      kind: "story",
      refId: "1",
      payload: { storyId: 1 },
      createdAt: 100,
      tags: ["read-later", "ai"],
    };
    await db.put("bookmarks", bookmark);
    expect(await db.get("bookmarks", "b1")).toEqual(bookmark);

    // Multi-entry index — each tag is keyed independently.
    const byTag = await db.getAllFromIndex("bookmarks", "by-tags", "ai");
    expect(byTag).toHaveLength(1);

    const visit: VisitRecord = {
      storyId: 42,
      lastVisitedAt: 1234,
      lastSeenComments: [1, 2, 3],
    };
    await db.put("visits", visit);
    expect(await db.get("visits", 42)).toEqual(visit);

    const history: HistoryRecord = {
      id: "story:1:100",
      kind: "story",
      refId: "1",
      title: "x",
      visitedAt: 100,
    };
    await db.put("history", history);
    expect(await db.get("history", "story:1:100")).toEqual(history);

    const highlight: HighlightRecord = {
      id: "h1",
      storyId: 1,
      commentId: 2,
      anchor: { text: "hi", charOffset: 0, contextHashBefore: "", contextHashAfter: "" },
      color: "yellow",
      createdAt: 200,
    };
    await db.put("highlights", highlight);
    expect(await db.get("highlights", "h1")).toEqual(highlight);

    const pref: PrefRecord = { key: "controlPad.pos", value: { x: 10, y: 20 } };
    await db.put("prefs", pref);
    expect(await db.get("prefs", "controlPad.pos")).toEqual(pref);
  });
});
