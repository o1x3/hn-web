import type { CommentNode } from "@/lib/hn/types";
import { __test } from "@/lib/replies/new-comments";
import { describe, expect, it } from "vitest";

const { buildHasNewSet, collectNewIds } = __test;

function node(id: number, createdAt: number, children: CommentNode[] = []): CommentNode {
  return {
    id,
    author: `u${id}`,
    textHtml: "",
    createdAt,
    dead: false,
    deleted: false,
    children,
  };
}

const NOW_S = 1_700_000_000; // arbitrary unix seconds
const VISIT_MS = NOW_S * 1000; // visited "now"

describe("buildHasNewSet", () => {
  it("returns empty when lastVisitedAt is missing or zero", () => {
    const tree = [node(1, NOW_S + 100)];
    expect(buildHasNewSet(tree, null).size).toBe(0);
    expect(buildHasNewSet(tree, undefined).size).toBe(0);
    expect(buildHasNewSet(tree, 0).size).toBe(0);
  });

  it("flags every node when all are newer than lastVisitedAt", () => {
    const tree = [
      node(1, NOW_S + 10, [node(2, NOW_S + 20, [node(3, NOW_S + 30)])]),
      node(4, NOW_S + 40),
    ];
    const s = buildHasNewSet(tree, VISIT_MS);
    expect([...s].sort()).toEqual([1, 2, 3, 4]);
  });

  it("flags none when all are older", () => {
    const tree = [node(1, NOW_S - 10, [node(2, NOW_S - 20)])];
    expect(buildHasNewSet(tree, VISIT_MS).size).toBe(0);
  });

  it("includes ancestors of new descendants but skips siblings without new in subtree", () => {
    // Root 1 (old) has child 2 (old) with grandchild 3 (NEW) -> 1,2,3 in set.
    // Root 4 (old) has child 5 (old) -> 4 and 5 not in set.
    const tree = [
      node(1, NOW_S - 100, [node(2, NOW_S - 50, [node(3, NOW_S + 10)])]),
      node(4, NOW_S - 100, [node(5, NOW_S - 50)]),
    ];
    const s = buildHasNewSet(tree, VISIT_MS);
    expect([...s].sort()).toEqual([1, 2, 3]);
  });

  it("handles deep nesting where only a leaf is new", () => {
    let leaf = node(10, NOW_S + 1);
    for (let i = 9; i >= 1; i--) leaf = node(i, NOW_S - 1000, [leaf]);
    const s = buildHasNewSet([leaf], VISIT_MS);
    expect(s.size).toBe(10);
  });
});

describe("collectNewIds", () => {
  it("returns ids in DFS render order", () => {
    const tree = [
      node(1, NOW_S + 10, [node(2, NOW_S - 10, [node(3, NOW_S + 30)])]),
      node(4, NOW_S + 40),
    ];
    expect(collectNewIds(tree, VISIT_MS)).toEqual([1, 3, 4]);
  });

  it("returns empty when nothing is new", () => {
    const tree = [node(1, NOW_S - 10)];
    expect(collectNewIds(tree, VISIT_MS)).toEqual([]);
  });
});
