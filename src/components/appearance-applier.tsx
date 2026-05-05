"use client";

import { applyAppearance } from "@/lib/appearance/store";
import { type Appearance, STORAGE_KEY } from "@/lib/appearance/types";
import * as React from "react";

/**
 * Re-applies appearance prefs on mount and on cross-tab `storage` events.
 * The pre-hydration script in <head> already applies them on first paint;
 * this re-runs to cover SPA navigations that swap the <html> style cache.
 */
export function AppearanceApplier() {
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Appearance) : {};
      applyAppearance(parsed);
    } catch {
      applyAppearance({});
    }
  }, []);
  return null;
}
