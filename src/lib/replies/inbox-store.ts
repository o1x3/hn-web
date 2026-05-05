"use client";

import type { PrefRecord } from "@/lib/idb/schema";
import { idbGet, idbPut, useById } from "@/lib/idb/use-store";

const DEFAULT_LOOKBACK_MS = 7 * 24 * 3600 * 1000;
const DISMISS_CAP = 500;

const lastCheckedKey = (username: string) => `inbox:lastCheckedAt:${username}`;
const dismissedKey = (username: string) => `inbox:dismissed:${username}`;

export async function getInboxLastCheckedAt(username: string): Promise<number> {
  if (!username) return 0;
  const rec = (await idbGet("prefs", lastCheckedKey(username))) as PrefRecord | null;
  if (!rec || typeof rec.value !== "number") return Date.now() - DEFAULT_LOOKBACK_MS;
  return rec.value;
}

export async function markInboxChecked(username: string): Promise<void> {
  if (!username) return;
  const rec: PrefRecord = { key: lastCheckedKey(username), value: Date.now() };
  await idbPut("prefs", rec);
}

export async function getDismissedReplyIds(username: string): Promise<number[]> {
  if (!username) return [];
  const rec = (await idbGet("prefs", dismissedKey(username))) as PrefRecord | null;
  return Array.isArray(rec?.value) ? (rec.value as number[]) : [];
}

export async function dismissReply(username: string, replyId: number): Promise<void> {
  if (!username) return;
  const prev = await getDismissedReplyIds(username);
  if (prev.includes(replyId)) return;
  const next = [...prev, replyId];
  const trimmed = next.length > DISMISS_CAP ? next.slice(next.length - DISMISS_CAP) : next;
  const rec: PrefRecord = { key: dismissedKey(username), value: trimmed };
  await idbPut("prefs", rec);
}

/** Reactive read of the lastCheckedAt pref. Defaults to 7d ago if unset. */
export function useInboxLastCheckedAt(username: string | null): number | null {
  const { data } = useById("prefs", username ? lastCheckedKey(username) : null);
  if (!username) return null;
  if (data && typeof data.value === "number") return data.value;
  return Date.now() - DEFAULT_LOOKBACK_MS;
}

/** Reactive read of dismissed reply ids. */
export function useDismissedReplyIds(username: string | null): number[] {
  const { data } = useById("prefs", username ? dismissedKey(username) : null);
  if (!username || !data || !Array.isArray(data.value)) return [];
  return data.value as number[];
}
