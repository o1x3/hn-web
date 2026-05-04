/**
 * Debug-only structured logger for IDB writes. Gated behind
 * `localStorage.hn_idb_debug === "1"` so it is silent in production.
 *
 * Used per the cross-cutting requirement in docs/todo.md: "Every action that
 * writes to IDB also fires a structured log (debug only) for migration
 * testability."
 */
export type IdbAction = "add" | "put" | "delete" | "clear" | "bulkPut";

export function logIdbEvent(action: IdbAction, store: string, key?: unknown): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage?.getItem("hn_idb_debug") !== "1") return;
  } catch {
    return;
  }
  // eslint-disable-next-line no-console
  console.debug(`[hn-idb] ${action} ${store}`, key);
}
