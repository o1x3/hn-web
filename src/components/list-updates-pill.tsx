"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Lightweight live-updates pill. Polls `/api/items?ids=…` (or just the rank
 * count) every 90s and surfaces a "N new" pill at the top of the page that
 * reloads the route on click.
 *
 * We don't want to refetch the full list silently because we'd disrupt the
 * user's scroll position. Instead we poll a thin endpoint and prompt.
 */
export function ListUpdatesPill({
  kind,
  initialTopId,
}: {
  kind: string;
  initialTopId: number | null;
}) {
  const router = useRouter();
  const [delta, setDelta] = React.useState(0);

  React.useEffect(() => {
    if (initialTopId == null) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/list-head?kind=${encodeURIComponent(kind)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = (await res.json()) as { ids?: number[] };
        if (cancelled || !j.ids) return;
        // count how many ids in the live list are *newer* (greater) than
        // the id we rendered at rank 0 on first paint.
        const ids = j.ids;
        if (initialTopId == null) return;
        const idx = ids.indexOf(initialTopId);
        const fresh = idx > 0 ? idx : 0;
        setDelta(fresh);
      } catch {
        // ignore — offline / aborted
      } finally {
        if (!cancelled) timer = setTimeout(tick, 90_000);
      }
    }

    timer = setTimeout(tick, 90_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialTopId, kind]);

  if (delta <= 0) return null;
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="sticky top-14 z-30 mx-auto mb-2 flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
    >
      ↑ {delta > 30 ? "30+" : delta} new {delta === 1 ? "story" : "stories"} — refresh
    </button>
  );
}
