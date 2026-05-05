import type { AlgoliaSearchResponse, AlgoliaTreeNode } from "@/lib/hn/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hn/algolia", () => ({
  search: vi.fn(),
  getItemTree: vi.fn(),
}));

import { getItemTree, search } from "@/lib/hn/algolia";
import { getRepliesForUser } from "@/lib/replies/inbox";

const mockSearch = vi.mocked(search);
const mockGetItemTree = vi.mocked(getItemTree);

function hits(...ids: number[]): AlgoliaSearchResponse {
  return {
    hits: ids.map((id) => ({ objectID: String(id), created_at_i: 0 })),
    page: 0,
    nbHits: ids.length,
    nbPages: 1,
    hitsPerPage: 50,
  };
}

function tree(opts: {
  id: number;
  storyId?: number;
  title?: string;
  text?: string;
  children?: AlgoliaTreeNode[];
}): AlgoliaTreeNode {
  return {
    id: opts.id,
    story_id: opts.storyId ?? opts.id,
    title: opts.title ?? "",
    text: opts.text ?? "",
    children: opts.children ?? [],
  };
}

function child(id: number, author: string, createdAtI: number, text = ""): AlgoliaTreeNode {
  return { id, author, created_at_i: createdAtI, text };
}

describe("getRepliesForUser", () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockGetItemTree.mockReset();
  });

  it("returns nothing when the user has no comments", async () => {
    mockSearch.mockResolvedValue(hits());
    expect(await getRepliesForUser("me", 0)).toEqual([]);
    expect(mockGetItemTree).not.toHaveBeenCalled();
  });

  it("filters out my own replies and replies older than `since`", async () => {
    mockSearch.mockResolvedValue(hits(100, 200));
    mockGetItemTree.mockImplementation(async (id) => {
      if (id === 100) {
        return tree({
          id: 100,
          storyId: 1,
          title: "S1",
          text: "<p>my parent</p>",
          children: [
            child(101, "me", 1_000_000), // self-reply, ignore
            child(102, "alice", 999_000), // before since, ignore
            child(103, "bob", 2_000_000, "hi"),
          ],
        });
      }
      if (id === 200) {
        return tree({
          id: 200,
          storyId: 2,
          title: "S2",
          text: "another parent",
          children: [child(201, "carol", 3_000_000, "yo")],
        });
      }
      return null;
    });

    const replies = await getRepliesForUser("me", 1_500_000 * 1000); // sinceMs
    expect(replies.map((r) => r.id)).toEqual([201, 103]);
    expect(replies[0].author).toBe("carol");
    expect(replies[0].storyId).toBe(2);
    expect(replies[0].storyTitle).toBe("S2");
    expect(replies[1].parentId).toBe(100);
  });

  it("sorts replies by createdAt desc across multiple parents", async () => {
    mockSearch.mockResolvedValue(hits(10, 20, 30));
    mockGetItemTree.mockImplementation(async (id) => {
      if (id === 10) return tree({ id: 10, children: [child(11, "a", 5)] });
      if (id === 20) return tree({ id: 20, children: [child(21, "b", 9)] });
      if (id === 30) return tree({ id: 30, children: [child(31, "c", 7)] });
      return null;
    });
    const replies = await getRepliesForUser("me", 0);
    expect(replies.map((r) => r.createdAt)).toEqual([9, 7, 5]);
  });

  it("survives a tree fetch failure", async () => {
    mockSearch.mockResolvedValue(hits(1, 2));
    mockGetItemTree.mockImplementation(async (id) => {
      if (id === 1) throw new Error("upstream");
      return tree({ id: 2, children: [child(22, "x", 10)] });
    });
    const replies = await getRepliesForUser("me", 0);
    expect(replies.map((r) => r.id)).toEqual([22]);
  });

  it("strips HTML and truncates parent snippet", async () => {
    mockSearch.mockResolvedValue(hits(1));
    const long = `<p>${"a".repeat(300)}</p>`;
    mockGetItemTree.mockResolvedValue(tree({ id: 1, text: long, children: [child(2, "b", 100)] }));
    const replies = await getRepliesForUser("me", 0);
    expect(replies[0].parentTextSnippet.length).toBeLessThanOrEqual(140);
    expect(replies[0].parentTextSnippet.endsWith("…")).toBe(true);
    expect(replies[0].parentTextSnippet).not.toContain("<p>");
  });
});
