"use client";

import type { HistoryKind, HistoryRecord } from "@/lib/idb/schema";
import { idbClear, idbDelete, idbGetAll, idbPut, notifyStore, useAll } from "@/lib/idb/use-store";

const DEDUPE_WINDOW_MS = 60_000;

export async function recordVisit(args: {
  kind: HistoryKind;
  refId: string;
  title?: string;
  visitedAt?: number;
}): Promise<void> {
  const visitedAt = args.visitedAt ?? Date.now();
  // Look up the most-recent matching visit; collapse if within DEDUPE_WINDOW_MS.
  const all = await idbGetAll("history");
  const recent = all
    .filter((h) => h.kind === args.kind && h.refId === args.refId)
    .sort((a, b) => b.visitedAt - a.visitedAt)[0];
  if (recent && visitedAt - recent.visitedAt < DEDUPE_WINDOW_MS) {
    // Update the existing row's title/timestamp rather than create a new row.
    await idbPut("history", {
      ...recent,
      visitedAt,
      title: args.title ?? recent.title,
    });
    return;
  }
  const rec: HistoryRecord = {
    id: `${args.kind}:${args.refId}:${visitedAt}`,
    kind: args.kind,
    refId: args.refId,
    title: args.title,
    visitedAt,
  };
  await idbPut("history", rec);
}

export async function clearHistory(): Promise<void> {
  await idbClear("history");
  notifyStore("history");
}

export async function deleteVisit(id: string): Promise<void> {
  await idbDelete("history", id);
}

export function useHistory() {
  return useAll("history");
}
