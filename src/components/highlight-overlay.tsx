"use client";

import { locateAnchor, useHighlightsByStory } from "@/lib/highlight/store";
import * as React from "react";

/**
 * After hydration, walks `[data-comment-id]` containers and wraps stored
 * highlight ranges with `<mark data-color>` overlays.
 *
 * Graceful failure: if a comment's text was edited and the anchor doesn't
 * resolve, we skip the overlay; the highlight stays in `/bookmarks` only.
 */
export function HighlightOverlay({ storyId }: { storyId: number }) {
  const { data } = useHighlightsByStory(storyId);

  React.useEffect(() => {
    if (!data || data.length === 0) return;
    // Clean up previous marks first
    for (const el of Array.from(document.querySelectorAll("mark[data-hl-id]"))) {
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    }

    for (const h of data) {
      // Find the right container — comment body if commentId, else story body.
      const selector = h.commentId
        ? `[data-comment-id="${h.commentId}"] [data-hn-text]`
        : "[data-hn-text]";
      const container = document.querySelector<HTMLElement>(selector);
      if (!container) continue;
      const range = locateAnchor(container, h.anchor);
      if (!range) continue;
      try {
        const mark = document.createElement("mark");
        mark.setAttribute("data-hl-id", h.id);
        mark.setAttribute("data-color", h.color);
        mark.className = colorClass(h.color);
        range.surroundContents(mark);
      } catch {
        // surroundContents fails if the range crosses element boundaries;
        // skip — the highlight remains saved in /bookmarks.
      }
    }
  }, [data]);

  return null;
}

function colorClass(color: string): string {
  if (color === "orange") return "bg-orange-400/40 rounded";
  if (color === "pink") return "bg-pink-400/40 rounded";
  return "bg-yellow-300/40 rounded";
}
