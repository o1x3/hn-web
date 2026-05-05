"use client";

import { setPref, usePref } from "@/lib/idb/prefs";
import * as React from "react";

export type IndexViewMode = "list" | "table";

export const ALL_COLUMNS = [
  { id: "rank", label: "#", default: true },
  { id: "score", label: "Score", default: true },
  { id: "title", label: "Title", default: true, locked: true },
  { id: "host", label: "Site", default: true },
  { id: "by", label: "By", default: true },
  { id: "age", label: "Age", default: true },
  { id: "comments", label: "Comments", default: true },
  { id: "type", label: "Type", default: false },
  { id: "pph", label: "Pts/hr", default: false },
] as const;

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];

export const DEFAULT_COLUMNS: ColumnId[] = ALL_COLUMNS.filter((c) => c.default).map((c) => c.id);

export function useIndexViewMode(): [IndexViewMode, (m: IndexViewMode) => void] {
  const stored = usePref<IndexViewMode>("index.viewMode");
  const value = stored ?? "list";
  const set = React.useCallback((m: IndexViewMode) => {
    setPref("index.viewMode", m).catch(() => {});
  }, []);
  return [value, set];
}

export function useIndexColumns(): [
  ColumnId[],
  (cols: ColumnId[]) => void,
  (id: ColumnId) => void,
] {
  const stored = usePref<ColumnId[]>("index.columns");
  const value = stored && Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_COLUMNS;
  const set = React.useCallback((cols: ColumnId[]) => {
    setPref("index.columns", cols).catch(() => {});
  }, []);
  const toggle = React.useCallback(
    (id: ColumnId) => {
      const meta = ALL_COLUMNS.find((c) => c.id === id);
      if (meta && "locked" in meta && meta.locked) return; // title locked on
      const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
      set(next);
    },
    [value, set],
  );
  return [value, set, toggle];
}
