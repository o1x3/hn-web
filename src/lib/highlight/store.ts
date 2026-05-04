"use client";

import type { HighlightColor, HighlightRecord } from "@/lib/idb/schema";
import { idbDelete, idbGet, idbPut, notifyStore, useByIndex } from "@/lib/idb/use-store";
import { uuid } from "@/lib/uuid";

export interface CreateHighlightArgs {
  storyId: number;
  commentId?: number;
  text: string;
  charOffset: number;
  contextBefore: string;
  contextAfter: string;
  color?: HighlightColor;
}

export async function addHighlight(a: CreateHighlightArgs): Promise<HighlightRecord> {
  const rec: HighlightRecord = {
    id: uuid(),
    storyId: a.storyId,
    commentId: a.commentId,
    anchor: {
      text: a.text,
      charOffset: a.charOffset,
      contextHashBefore: a.contextBefore,
      contextHashAfter: a.contextAfter,
    },
    color: a.color ?? "yellow",
    createdAt: Date.now(),
  };
  await idbPut("highlights", rec);
  return rec;
}

export async function setHighlightColor(id: string, color: HighlightColor): Promise<void> {
  const cur = await idbGet("highlights", id);
  if (!cur) return;
  await idbPut("highlights", { ...cur, color });
}

export async function removeHighlight(id: string): Promise<void> {
  await idbDelete("highlights", id);
}

export function useHighlightsByStory(storyId: number | null | undefined) {
  return useByIndex("highlights", "by-storyId", storyId ?? -1);
}

/** Pure: try to locate `anchor` inside a text container. Returns Range | null. */
export function locateAnchor(
  container: HTMLElement,
  anchor: HighlightRecord["anchor"],
): Range | null {
  const text = container.textContent ?? "";
  // Try exact charOffset first.
  const candidate = text.slice(
    Math.max(0, anchor.charOffset),
    anchor.charOffset + anchor.text.length,
  );
  if (candidate === anchor.text) {
    return rangeFromOffsets(container, anchor.charOffset, anchor.charOffset + anchor.text.length);
  }
  // Fall back: find by exact text occurrence with matching context.
  let idx = -1;
  let from = 0;
  for (;;) {
    const found = text.indexOf(anchor.text, from);
    if (found === -1) break;
    const before = text.slice(Math.max(0, found - anchor.contextHashBefore.length), found);
    const after = text.slice(
      found + anchor.text.length,
      found + anchor.text.length + anchor.contextHashAfter.length,
    );
    if (before === anchor.contextHashBefore && after === anchor.contextHashAfter) {
      idx = found;
      break;
    }
    from = found + anchor.text.length;
  }
  if (idx === -1) {
    // Last-ditch: any occurrence of the text at all.
    idx = text.indexOf(anchor.text);
  }
  if (idx === -1) return null;
  return rangeFromOffsets(container, idx, idx + anchor.text.length);
}

function rangeFromOffsets(container: HTMLElement, start: number, end: number): Range | null {
  // Manually collect text nodes — depends only on `childNodes` and `nodeType`,
  // both well-supported across browsers and test environments.
  const textNodes: Text[] = [];
  collectTextNodes(container, textNodes);
  let acc = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  for (const n of textNodes) {
    const len = n.nodeValue?.length ?? 0;
    if (!startNode && acc + len >= start) {
      startNode = n;
      startOffset = start - acc;
    }
    if (!endNode && acc + len >= end) {
      endNode = n;
      endOffset = end - acc;
      break;
    }
    acc += len;
  }
  if (!startNode || !endNode) return null;
  const doc = container.ownerDocument ?? (typeof document !== "undefined" ? document : null);
  if (!doc) return null;
  const r = doc.createRange();
  try {
    r.setStart(startNode, startOffset);
    r.setEnd(endNode, endOffset);
    return r;
  } catch {
    return null;
  }
}

function collectTextNodes(node: Node, out: Text[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      out.push(child as Text);
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      collectTextNodes(child, out);
    }
  }
}

/** Manual nudge after batch import. */
export function refreshHighlights() {
  notifyStore("highlights");
}
