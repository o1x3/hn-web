import { type IDBPDatabase, openDB } from "idb";
import { runMigrations } from "./migrations";
import { DB_NAME, DB_VERSION, type HnSchema } from "./schema";

let cached: Promise<IDBPDatabase<HnSchema>> | null = null;

/**
 * Returns the typed IDB handle. Singleton per page so multiple stores share
 * one connection. No-ops on the server / when IDB isn't available.
 */
export function openHnDb(): Promise<IDBPDatabase<HnSchema>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (!cached) {
    cached = openDB<HnSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        runMigrations(db, oldVersion, newVersion, tx);
      },
      blocked() {
        // Another tab holds an older version. The user can refresh.
        // eslint-disable-next-line no-console
        console.warn("[hn-idb] blocked by another tab");
      },
      blocking() {
        // We're holding an old version open against a newer tab; close.
        cached?.then((db) => db.close()).catch(() => {});
        cached = null;
      },
      terminated() {
        cached = null;
      },
    });
  }
  return cached;
}

/** For tests only — closes the open DB and drops the cached promise. */
export async function __resetIdbCache(): Promise<void> {
  const prev = cached;
  cached = null;
  if (prev) {
    try {
      const db = await prev;
      db.close();
    } catch {
      // ignore
    }
  }
}

export function isIdbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}
