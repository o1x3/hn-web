import { __test } from "@/lib/replies/visit-store";
/**
 * Tests the F2 visit store's `mergeCapped` logic — older ids drop when
 * adding new ones beyond the 5000-cap so the array doesn't grow unbounded.
 */
import { describe, expect, it } from "vitest";

const { mergeCapped } = __test;

describe("mergeCapped", () => {
  it("dedupes preserved ids in original order then appends new", () => {
    expect(mergeCapped([1, 2, 3], [3, 4, 5], 100)).toEqual([1, 2, 3, 4, 5]);
  });

  it("truncates oldest when over the cap", () => {
    const prev = Array.from({ length: 5 }, (_, i) => i);
    const next = [10, 11, 12];
    const merged = mergeCapped(prev, next, 5);
    expect(merged.length).toBe(5);
    // Oldest (0,1,2) dropped; newest preserved.
    expect(merged).toEqual([3, 4, 10, 11, 12]);
  });

  it("returns prev unchanged when next is empty", () => {
    expect(mergeCapped([1, 2], [], 100)).toEqual([1, 2]);
  });
});
