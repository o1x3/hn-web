"use client";

import { StoryCard } from "@/components/story-card";
import { Button } from "@/components/ui/button";
import type { ListKind, RawItem } from "@/lib/hn/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as React from "react";

interface PageData {
  items: RawItem[];
  nextOffset: number | null;
}

export function LoadMore({
  kind,
  allIds,
  pageSize,
  initialOffset,
  loggedIn,
}: {
  kind: ListKind;
  allIds: number[];
  pageSize: number;
  initialOffset: number;
  loggedIn: boolean;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const query = useInfiniteQuery<PageData>({
    queryKey: ["story-list", kind, allIds.length],
    initialPageParam: initialOffset,
    getNextPageParam: (last) => last.nextOffset,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const slice = allIds.slice(offset, offset + pageSize);
      if (slice.length === 0) return { items: [], nextOffset: null };
      const res = await fetch(`/api/items?ids=${slice.join(",")}`);
      const items = (await res.json()) as RawItem[];
      const nextOffset = offset + pageSize < allIds.length ? offset + pageSize : null;
      return { items, nextOffset };
    },
  });

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  const flat = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <div className="flex flex-col gap-2">
        {flat.map((item, i) => (
          <StoryCard key={item.id} item={item} rank={initialOffset + i + 1} loggedIn={loggedIn} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
      {query.hasNextPage && !query.isFetchingNextPage ? (
        <div className="py-3 text-center">
          <Button variant="outline" size="sm" onClick={() => query.fetchNextPage()}>
            Load more
          </Button>
        </div>
      ) : null}
      {query.isFetchingNextPage ? (
        <div className="py-3 text-center text-xs text-muted-foreground">Loading…</div>
      ) : null}
      {!query.hasNextPage && flat.length > 0 ? (
        <div className="py-3 text-center text-xs text-muted-foreground">— end —</div>
      ) : null}
    </>
  );
}
