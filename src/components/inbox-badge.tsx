"use client";

import { useDismissedReplyIds, useInboxLastCheckedAt } from "@/lib/replies/inbox-store";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

interface InboxResponse {
  replies: { id: number }[];
}

/**
 * Renders the unread reply count next to the Inbox sidebar link.
 * Hidden when the user is logged out, the count is zero, or fetch fails.
 *
 * Refetches on `hn:visit-update` (fired by <MarkVisited>) so the badge
 * stays roughly fresh as the user moves through the app.
 */
export function InboxBadge({ username }: { username: string | null }) {
  const since = useInboxLastCheckedAt(username);
  const dismissed = useDismissedReplyIds(username);

  const { data, refetch } = useQuery<InboxResponse>({
    queryKey: ["inbox-count", username, since],
    enabled: !!username && since != null,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch(`/api/inbox?since=${since ?? 0}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as InboxResponse;
    },
  });

  React.useEffect(() => {
    const onVisit = () => refetch();
    window.addEventListener("hn:visit-update", onVisit);
    return () => window.removeEventListener("hn:visit-update", onVisit);
  }, [refetch]);

  if (!username) return null;
  const count = (data?.replies ?? []).filter((r) => !dismissed.includes(r.id)).length;
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
