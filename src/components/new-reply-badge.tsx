"use client";

import { getVisit } from "@/lib/replies/visit-store";
import * as React from "react";

/**
 * "N new" badge on story cards. We don't have descendant timestamps at the
 * list level, so we approximate by comparing the live `descendants` count
 * against the count of comment ids we saw on the user's last visit.
 *
 * `currentDescendants - lastSeenComments.length` ≥ 1 → render "+N".
 * Cap at 99+ so the pill stays narrow.
 */
export function NewReplyBadge({
  storyId,
  currentDescendants,
}: {
  storyId: number;
  currentDescendants?: number | null;
}) {
  const [delta, setDelta] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const v = await getVisit(storyId);
      if (cancelled) return;
      if (!v) {
        setDelta(0);
        return;
      }
      const cur = currentDescendants ?? 0;
      setDelta(Math.max(0, cur - v.lastSeenComments.length));
    };
    load();
    const handler = () => load();
    window.addEventListener("hn:visit-update", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("hn:visit-update", handler);
    };
  }, [storyId, currentDescendants]);

  if (delta <= 0) return null;
  const label = delta > 99 ? "99+" : String(delta);
  return (
    <span
      className="inline-flex h-4 items-center rounded bg-primary/15 px-1.5 text-[10px] font-medium uppercase tracking-wide text-primary"
      title={`${delta} new since your last visit`}
    >
      +{label} new
    </span>
  );
}
