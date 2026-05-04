/**
 * Round-trip exportAll → importAll → exportAll. Idempotent in merge mode;
 * replace mode wipes prior records.
 */
import "fake-indexeddb/auto";
import { exportAll, importAll, wipeAll } from "@/lib/backup";
import { __resetIdbCache } from "@/lib/idb/db";
import { idbPut } from "@/lib/idb/use-store";
import { afterEach, describe, expect, it } from "vitest";

afterEach(async () => {
  await __resetIdbCache();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("hn-client");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

describe("backup.ts", () => {
  it("merge round-trips identically", async () => {
    await idbPut("bookmarks", {
      id: "b1",
      kind: "story",
      refId: "1",
      payload: { storyId: 1, title: "x" },
      createdAt: 1,
    });
    await idbPut("history", {
      id: "story:1:1",
      kind: "story",
      refId: "1",
      title: "x",
      visitedAt: 1,
    });
    const a = await exportAll();
    await importAll(a, "merge");
    const b = await exportAll();
    expect(b.bookmarks).toEqual(a.bookmarks);
    expect(b.history).toEqual(a.history);
    expect(b.visits).toEqual(a.visits);
    expect(b.highlights).toEqual(a.highlights);
  });

  it("replace mode wipes prior records", async () => {
    await idbPut("bookmarks", {
      id: "old",
      kind: "story",
      refId: "9",
      payload: {},
      createdAt: 1,
    });
    const blob = {
      version: 1,
      exportedAt: 0,
      bookmarks: [{ id: "fresh", kind: "story", refId: "10", payload: {}, createdAt: 2 } as const],
      visits: [],
      history: [],
      highlights: [],
      prefs: [],
    };
    await importAll(blob, "replace");
    const after = await exportAll();
    expect(after.bookmarks.map((b) => b.id)).toEqual(["fresh"]);
  });

  it("rejects a backup with a future version", async () => {
    await expect(
      importAll(
        {
          version: 999,
          exportedAt: 0,
          bookmarks: [],
          visits: [],
          history: [],
          highlights: [],
          prefs: [],
        },
        "merge",
      ),
    ).rejects.toThrow(/newer version/);
  });

  it("wipeAll empties every store", async () => {
    await idbPut("bookmarks", { id: "z", kind: "story", refId: "0", payload: {}, createdAt: 0 });
    await wipeAll();
    const exp = await exportAll();
    expect(exp.bookmarks).toEqual([]);
    expect(exp.history).toEqual([]);
  });
});
