"use client";

import * as React from "react";
import { isIdbAvailable, openHnDb } from "./db";
import { type IdbAction, logIdbEvent } from "./log";
import type { HnSchema, StoreName } from "./schema";

/**
 * Tiny pub/sub keyed by store name. `useSyncExternalStore` consumers
 * re-read from IDB whenever a writer in the same tab fires an event.
 * Cross-tab updates piggy-back on `BroadcastChannel` when available.
 */
type Listener = () => void;
const listeners = new Map<StoreName, Set<Listener>>();

let bc: BroadcastChannel | null = null;
function getBc(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!bc) {
    bc = new BroadcastChannel("hn-client-idb");
    bc.addEventListener("message", (ev) => {
      const store = ev.data?.store as StoreName | undefined;
      if (store) emitLocal(store);
    });
  }
  return bc;
}

function emitLocal(store: StoreName) {
  const set = listeners.get(store);
  if (set) for (const fn of set) fn();
}

function subscribe(store: StoreName, fn: Listener): () => void {
  let set = listeners.get(store);
  if (!set) {
    set = new Set();
    listeners.set(store, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
  };
}

function notify(store: StoreName) {
  emitLocal(store);
  getBc()?.postMessage({ store });
}

/**
 * Read all rows from a store. Re-queries when the store changes.
 * SSR-safe: returns `{ data: null, isLoading: true }` on the server.
 */
export function useAll<S extends StoreName>(
  store: S,
): {
  data: HnSchema[S]["value"][] | null;
  isLoading: boolean;
  error: Error | null;
} {
  // useSyncExternalStore-driven invalidation of a useState-held promise.
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => subscribe(store, () => setTick((n) => n + 1)), [store]);
  return useAsyncRead(
    React.useCallback(async () => {
      if (!isIdbAvailable()) return [] as HnSchema[S]["value"][];
      const db = await openHnDb();
      return (await db.getAll(store)) as HnSchema[S]["value"][];
    }, [store]),
    tick,
  );
}

export function useByIndex<S extends StoreName>(
  store: S,
  indexName: string,
  query?: IDBKeyRange | string | number,
): {
  data: HnSchema[S]["value"][] | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => subscribe(store, () => setTick((n) => n + 1)), [store]);
  // Stringify the query so deps are stable. IDBKeyRange identity changes per render.
  // Guard the global — `IDBKeyRange` is undefined during SSR.
  const queryKey = React.useMemo(
    () =>
      typeof IDBKeyRange !== "undefined" && query instanceof IDBKeyRange
        ? "range"
        : String(query ?? ""),
    [query],
  );
  return useAsyncRead(
    React.useCallback(async () => {
      if (!isIdbAvailable()) return [] as HnSchema[S]["value"][];
      const db = await openHnDb();
      const tx = db.transaction(store);
      // biome-ignore lint/suspicious/noExplicitAny: idb's typed index generics are not exposed
      const idx = (tx.store as any).index(indexName);
      const all = (await idx.getAll(query ?? null)) as HnSchema[S]["value"][];
      return all;
    }, [store, indexName, queryKey]),
    tick,
  );
}

export function useById<S extends StoreName>(
  store: S,
  key: HnSchema[S]["key"] | null | undefined,
): {
  data: HnSchema[S]["value"] | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => subscribe(store, () => setTick((n) => n + 1)), [store]);
  const keyStr = String(key ?? "");
  return useAsyncRead(
    React.useCallback(async () => {
      if (!isIdbAvailable() || key == null) return null;
      const db = await openHnDb();
      const v = await db.get(store, key as string & number);
      return (v ?? null) as HnSchema[S]["value"] | null;
    }, [store, keyStr]),
    tick,
  );
}

/** Generic async-read hook that exposes loading/error state. */
function useAsyncRead<T>(
  load: () => Promise<T>,
  tick: number,
): { data: T | null; isLoading: boolean; error: Error | null } {
  const [state, setState] = React.useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>({ data: null, isLoading: true, error: null });
  React.useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    load().then(
      (data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      },
      (err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, tick]);
  return state;
}

/** Mutation helpers — fire-and-forget; notify subscribers after success. */
export async function idbPut<S extends StoreName>(
  store: S,
  value: HnSchema[S]["value"],
): Promise<void> {
  if (!isIdbAvailable()) return;
  const db = await openHnDb();
  await db.put(store, value);
  notifyAndLog("put", store, (value as { id?: unknown }).id);
}

export async function idbAdd<S extends StoreName>(
  store: S,
  value: HnSchema[S]["value"],
): Promise<void> {
  if (!isIdbAvailable()) return;
  const db = await openHnDb();
  await db.add(store, value);
  notifyAndLog("add", store, (value as { id?: unknown }).id);
}

export async function idbDelete<S extends StoreName>(
  store: S,
  key: HnSchema[S]["key"],
): Promise<void> {
  if (!isIdbAvailable()) return;
  const db = await openHnDb();
  await db.delete(store, key as string & number);
  notifyAndLog("delete", store, key);
}

export async function idbClear<S extends StoreName>(store: S): Promise<void> {
  if (!isIdbAvailable()) return;
  const db = await openHnDb();
  await db.clear(store);
  notifyAndLog("clear", store);
}

export async function idbBulkPut<S extends StoreName>(
  store: S,
  values: HnSchema[S]["value"][],
): Promise<void> {
  if (!isIdbAvailable() || values.length === 0) return;
  const db = await openHnDb();
  const tx = db.transaction(store, "readwrite");
  await Promise.all(values.map((v) => tx.store.put(v)));
  await tx.done;
  notifyAndLog("bulkPut", store, values.length);
}

export async function idbGet<S extends StoreName>(
  store: S,
  key: HnSchema[S]["key"],
): Promise<HnSchema[S]["value"] | null> {
  if (!isIdbAvailable()) return null;
  const db = await openHnDb();
  return ((await db.get(store, key as string & number)) ?? null) as HnSchema[S]["value"] | null;
}

export async function idbGetAll<S extends StoreName>(store: S): Promise<HnSchema[S]["value"][]> {
  if (!isIdbAvailable()) return [];
  const db = await openHnDb();
  return (await db.getAll(store)) as HnSchema[S]["value"][];
}

function notifyAndLog(action: IdbAction, store: StoreName, key?: unknown) {
  logIdbEvent(action, store, key);
  notify(store);
}

/** Manual nudge (e.g. after wipe/restore from JSON). */
export function notifyStore(store: StoreName) {
  notify(store);
}
