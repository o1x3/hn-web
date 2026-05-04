"use client";

import type { VisitRecord } from "@/lib/idb/schema";
import { idbClear, idbGet, idbPut, notifyStore, useAll } from "@/lib/idb/use-store";

const MAX_SEEN = 5000;

export async function markVisited(
  storyId: number,
  commentIds: number[],
  topId?: number,
): Promise<void> {
  const prev = await getVisit(storyId);
  const merged = mergeCapped(prev?.lastSeenComments ?? [], commentIds, MAX_SEEN);
  const rec: VisitRecord = {
    storyId,
    lastVisitedAt: Date.now(),
    lastTopComment: topId ?? prev?.lastTopComment,
    lastSeenComments: merged,
  };
  await idbPut("visits", rec);
}

export async function getVisit(storyId: number): Promise<VisitRecord | null> {
  return idbGet("visits", storyId);
}

export async function clearVisits(): Promise<void> {
  await idbClear("visits");
  notifyStore("visits");
}

export function useAllVisits() {
  return useAll("visits");
}

/** Cap merged history at `max` ids, dropping oldest. Order: prev then new. */
function mergeCapped(prev: number[], next: number[], max: number): number[] {
  const seen = new Set(prev);
  const merged = [...prev];
  for (const id of next) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  if (merged.length > max) return merged.slice(merged.length - max);
  return merged;
}

export const __test = { mergeCapped };
