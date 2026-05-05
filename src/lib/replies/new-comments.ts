import type { CommentNode } from "@/lib/hn/types";

/**
 * Walk the comment tree and identify nodes that are themselves new
 * (createdAt > lastVisitedAt) plus every ancestor on a path to one.
 *
 * The ancestor set is what powers the "show only new" filter: with
 * `data-only-new` set on the list root, CSS hides any node that's neither
 * `data-new` nor `data-has-new`, so siblings without new descendants vanish
 * while the relevant branches stay open.
 */
export function buildHasNewSet(
  nodes: CommentNode[],
  lastVisitedAt: number | null | undefined,
): Set<number> {
  const set = new Set<number>();
  if (!lastVisitedAt || lastVisitedAt <= 0) return set;
  walk(nodes, lastVisitedAt, set);
  return set;
}

function walk(nodes: CommentNode[], lastVisitedAt: number, set: Set<number>): boolean {
  let any = false;
  for (const n of nodes) {
    const selfNew = n.createdAt * 1000 > lastVisitedAt;
    const childNew = n.children.length > 0 && walk(n.children, lastVisitedAt, set);
    if (selfNew || childNew) {
      set.add(n.id);
      any = true;
    }
  }
  return any;
}

/**
 * Flat DFS list of new comment ids in the tree, in render order.
 * Useful for "jump to first new" — peek at index 0.
 */
export function collectNewIds(
  nodes: CommentNode[],
  lastVisitedAt: number | null | undefined,
): number[] {
  const out: number[] = [];
  if (!lastVisitedAt || lastVisitedAt <= 0) return out;
  collect(nodes, lastVisitedAt, out);
  return out;
}

function collect(nodes: CommentNode[], lastVisitedAt: number, out: number[]): void {
  for (const n of nodes) {
    if (n.createdAt * 1000 > lastVisitedAt) out.push(n.id);
    if (n.children.length) collect(n.children, lastVisitedAt, out);
  }
}

export const __test = { buildHasNewSet, collectNewIds };
