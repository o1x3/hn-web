import type { IDBPDatabase, IDBPTransaction } from "idb";
import type { HnSchema, StoreName } from "./schema";

/**
 * Versioned IndexedDB upgrade. Each branch is forward-only and idempotent
 * via `objectStoreNames.contains` checks so re-runs (e.g. after a destructive
 * import) are safe.
 */
export function runMigrations(
  db: IDBPDatabase<HnSchema>,
  oldVersion: number,
  _newVersion: number | null,
  tx: IDBPTransaction<HnSchema, ArrayLike<StoreName>, "versionchange">,
): void {
  if (oldVersion < 1) {
    if (!db.objectStoreNames.contains("bookmarks")) {
      const s = db.createObjectStore("bookmarks", { keyPath: "id" });
      s.createIndex("by-kind", "kind");
      s.createIndex("by-createdAt", "createdAt");
      s.createIndex("by-refId", "refId");
      s.createIndex("by-tags", "tags", { multiEntry: true });
    }
    if (!db.objectStoreNames.contains("visits")) {
      const s = db.createObjectStore("visits", { keyPath: "storyId" });
      s.createIndex("by-lastVisitedAt", "lastVisitedAt");
    }
    if (!db.objectStoreNames.contains("history")) {
      const s = db.createObjectStore("history", { keyPath: "id" });
      s.createIndex("by-visitedAt", "visitedAt");
      s.createIndex("by-kind", "kind");
      s.createIndex("by-refId", "refId");
    }
    if (!db.objectStoreNames.contains("highlights")) {
      const s = db.createObjectStore("highlights", { keyPath: "id" });
      s.createIndex("by-storyId", "storyId");
      s.createIndex("by-commentId", "commentId");
      s.createIndex("by-createdAt", "createdAt");
    }
    if (!db.objectStoreNames.contains("prefs")) {
      db.createObjectStore("prefs", { keyPath: "key" });
    }
  }
  if (oldVersion < 2) {
    if (!db.objectStoreNames.contains("hidden")) {
      const s = db.createObjectStore("hidden", { keyPath: "storyId" });
      s.createIndex("by-hiddenAt", "hiddenAt");
    }
    if (!db.objectStoreNames.contains("collapsedThreads")) {
      const s = db.createObjectStore("collapsedThreads", { keyPath: "id" });
      s.createIndex("by-storyId", "storyId");
    }
  }
  // Future versions append here. Use `tx.objectStore(name)` to mutate
  // existing stores (e.g. add an index) without recreating data.
  void tx;
}
