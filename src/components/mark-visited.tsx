"use client";

import { getVisit, markVisited } from "@/lib/replies/visit-store";
import * as React from "react";

/**
 * Records the visit to a story (F2). Captures the descendant comment ids so
 * `lastSeenComments` represents what the user actually saw on this load.
 *
 * Also exposes the previous `lastVisitedAt` via `onLastVisited` so the parent
 * page can pass it down to <Comment> for orange-dot rendering.
 */
export function MarkVisited({
  storyId,
  commentIds,
  onLastVisited,
}: {
  storyId: number;
  commentIds: number[];
  onLastVisited?: (ms: number | null) => void;
}) {
  const fired = React.useRef(false);
  const idsKey = React.useMemo(() => commentIds.join(","), [commentIds]);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let cancelled = false;
    (async () => {
      try {
        const prev = await getVisit(storyId);
        if (!cancelled) onLastVisited?.(prev?.lastVisitedAt ?? null);
        await markVisited(storyId, commentIds);
        if (!cancelled) {
          window.dispatchEvent(new Event("hn:visit-update"));
        }
      } catch {
        // ignore — IDB may be unavailable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storyId, idsKey, onLastVisited, commentIds]);

  return null;
}
