"use client";

import { isIdbAvailable, openHnDb } from "@/lib/idb/db";
import * as React from "react";

/**
 * Mounts on first paint, opens the typed DB, and runs version migrations
 * via `idb`'s built-in upgrade callback. SSR-safe — does nothing server-side
 * or in private-mode browsers without IDB.
 */
export function IdbProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (!isIdbAvailable()) return;
    let cancelled = false;
    openHnDb().catch((err: unknown) => {
      if (cancelled) return;
      // eslint-disable-next-line no-console
      console.warn("[hn-idb] open failed", err);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return <>{children}</>;
}
