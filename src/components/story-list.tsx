import { ListUpdatesPill } from "@/components/list-updates-pill";
import { LoadMore } from "@/components/load-more";
import { StoryCard } from "@/components/story-card";
import { batchItems, getList } from "@/lib/hn/firebase";
import type { ListKind } from "@/lib/hn/types";

const PAGE_SIZE = 30;

export async function StoryList({
  kind,
  loggedIn,
}: {
  kind: ListKind;
  loggedIn: boolean;
}) {
  const ids = await getList(kind);
  const firstPage = ids.slice(0, PAGE_SIZE);
  const items = await batchItems(firstPage);

  return (
    <div className="flex flex-col gap-2">
      <ListUpdatesPill kind={kind} initialTopId={items[0]?.id ?? null} />
      {items.map((item, i) => (
        <StoryCard key={item.id} item={item} rank={i + 1} loggedIn={loggedIn} />
      ))}
      {ids.length > PAGE_SIZE ? (
        <LoadMore
          kind={kind}
          allIds={ids}
          pageSize={PAGE_SIZE}
          initialOffset={PAGE_SIZE}
          loggedIn={loggedIn}
        />
      ) : null}
    </div>
  );
}
