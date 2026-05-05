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

  // biome-ignore lint/correctness/useExhaustiveDependencies: commentIds intentionally omitted; the `fired` ref guards re-execution and we capture it via closure
  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    (async () => {
      try {
        const prev = await getVisit(storyId);
        // Always notify: under React StrictMode the first mount's cleanup
        // would have flipped a `cancelled` flag before this resolves, even
        // though `fired.current` correctly skips a re-fire on the second
        // mount. Setting state on an unmounted component is a no-op in
        // React 18+, so the cancel guard is unnecessary here.
        onLastVisited?.(prev?.lastVisitedAt ?? null);
        await markVisited(storyId, commentIds);
        window.dispatchEvent(new Event("hn:visit-update"));
      } catch {
        // ignore — IDB may be unavailable
      }
    })();
  }, [storyId, onLastVisited]);

  return null;
}
