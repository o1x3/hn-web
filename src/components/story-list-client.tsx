"use client";

import { IndexViewSwitcher } from "@/components/index-view-switcher";
import { StoryCard } from "@/components/story-card";
import { StoryTable } from "@/components/story-table";
import { Button } from "@/components/ui/button";
import { useHiddenIds } from "@/lib/hidden/store";
import type { ListKind, RawItem } from "@/lib/hn/types";
import { useIndexColumns, useIndexViewMode } from "@/lib/index-view/store";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as React from "react";

interface PageData {
  items: RawItem[];
  nextOffset: number | null;
}

export function StoryListClient({
  kind,
  initialItems,
  allIds,
  pageSize,
  loggedIn,
}: {
  kind: ListKind;
  initialItems: RawItem[];
  allIds: number[];
  pageSize: number;
  loggedIn: boolean;
}) {
  const [viewMode] = useIndexViewMode();
  const [columns] = useIndexColumns();
  const hidden = useHiddenIds();
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const initialOffset = initialItems.length;

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

  const additional = query.data?.pages.flatMap((p) => p.items) ?? [];
  const allItems = [...initialItems, ...additional].filter((it) => !hidden.has(it.id));

  return (
    <>
      <IndexViewSwitcher />
      {viewMode === "table" ? (
        <StoryTable items={allItems} columns={columns} loggedIn={loggedIn} />
      ) : (
        <div className="flex flex-col gap-2">
          {allItems.map((item, i) => (
            <StoryCard key={item.id} item={item} rank={i + 1} loggedIn={loggedIn} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
      {allIds.length > initialOffset + additional.length ? (
        <div className="py-3 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-muted-foreground">— end —</div>
      )}
    </>
  );
}
