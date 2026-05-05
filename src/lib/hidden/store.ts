"use client";

import { idbDelete, idbPut, useAll } from "@/lib/idb/use-store";
import * as React from "react";

export async function hideStory(storyId: number): Promise<void> {
  await idbPut("hidden", { storyId, hiddenAt: Date.now() });
}

export async function unhideStory(storyId: number): Promise<void> {
  await idbDelete("hidden", storyId);
}

export function useHiddenIds(): Set<number> {
  const { data } = useAll("hidden");
  return React.useMemo(() => new Set((data ?? []).map((r) => r.storyId)), [data]);
}
