import { locateAnchor } from "@/lib/highlight/store";
/**
 * `locateAnchor` is the heart of F3's graceful re-locate strategy. We test it
 * both on unchanged DOM (exact charOffset hit) and on a mutated DOM (falls
 * back to context-matching, then to a last-ditch occurrence search).
 */
import { describe, expect, it } from "vitest";

function makeContainer(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

describe("locateAnchor", () => {
  it("hits exact charOffset on unchanged text", () => {
    const c = makeContainer("<p>The quick brown fox.</p>");
    const range = locateAnchor(c, {
      text: "quick",
      charOffset: 4,
      contextHashBefore: "The ",
      contextHashAfter: " bro",
    });
    expect(range).not.toBeNull();
    expect(range?.toString()).toBe("quick");
  });

  it("falls back to context match when text shifts", () => {
    const c = makeContainer("<p>Prefix added. The quick brown fox.</p>");
    const range = locateAnchor(c, {
      text: "quick",
      // wrong charOffset — text now starts later
      charOffset: 4,
      contextHashBefore: "The ",
      contextHashAfter: " bro",
    });
    expect(range).not.toBeNull();
    expect(range?.toString()).toBe("quick");
  });

  it("returns null when text is missing entirely", () => {
    const c = makeContainer("<p>Completely different content.</p>");
    const range = locateAnchor(c, {
      text: "quick",
      charOffset: 4,
      contextHashBefore: "The ",
      contextHashAfter: " bro",
    });
    expect(range).toBeNull();
  });

  it("last-ditch: returns first occurrence when context fails", () => {
    const c = makeContainer("<p>X X X quick Y Y Y</p>");
    const range = locateAnchor(c, {
      text: "quick",
      charOffset: 999,
      contextHashBefore: "abcdef",
      contextHashAfter: "ghijkl",
    });
    expect(range?.toString()).toBe("quick");
  });
});
