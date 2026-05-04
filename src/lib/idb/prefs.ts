"use client";

import { idbGet, idbPut, useById } from "@/lib/idb/use-store";

export async function getPref<T>(key: string): Promise<T | null> {
  const rec = await idbGet("prefs", key);
  return (rec?.value as T | undefined) ?? null;
}

export async function setPref<T>(key: string, value: T): Promise<void> {
  await idbPut("prefs", { key, value });
}

export function usePref<T>(key: string): T | null {
  const rec = useById("prefs", key);
  return (rec.data?.value as T | undefined) ?? null;
}
