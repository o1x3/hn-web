import { BookmarkButton } from "@/components/bookmark-button";
import { DomainFavicon } from "@/components/domain-favicon";
import { FavoriteButton } from "@/components/favorite-button";
import { HoverUserCard } from "@/components/hover-user-card";
import { NewReplyBadge } from "@/components/new-reply-badge";
import { VoteButton } from "@/components/vote-button";
import type { RawItem } from "@/lib/hn/types";
import { relativeTime } from "@/lib/time";
import { cn, hostFromUrl } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function StoryCard({
  item,
  rank,
  loggedIn,
  historicalSnapshot = false,
}: {
  item: RawItem;
  rank?: number;
  loggedIn: boolean;
  /** F7: historical front-page render — hides interactive vote button. */
  historicalSnapshot?: boolean;
}) {
  const host = hostFromUrl(item.url);
  const isJob = item.type === "job";
  const internalUrl = item.url ?? `/item/${item.id}`;
  const isExternal = item.url != null;

  return (
    <article
      data-selectable
      data-id={item.id}
      data-href={item.url ?? ""}
      className={cn(
        "group relative flex gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border/80",
        "data-[selected=true]:ring-2 data-[selected=true]:ring-primary/60",
      )}
    >
      <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
        {historicalSnapshot ? (
          <span
            className="text-xs text-muted-foreground tabular-nums"
            title="Historical snapshot — voting is on the live HN page"
          >
            {item.score ?? 0}
          </span>
        ) : (
          <VoteButton itemId={item.id} initialScore={item.score ?? null} loggedIn={loggedIn} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex items-baseline gap-2">
          {rank ? (
            <span className="text-xs text-muted-foreground tabular-nums">{rank}.</span>
          ) : null}
          <h2 className="text-base font-semibold leading-snug">
            <a
              href={internalUrl}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="hover:underline"
            >
              {item.title ?? "(no title)"}
            </a>
            {host ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <DomainFavicon domain={host} />
                <a
                  href={`/search?q=site:${host}`}
                  className="hover:text-foreground"
                  title={`Search ${host}`}
                >
                  {host}
                </a>
              </span>
            ) : null}
          </h2>
        </header>

        <footer className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {!isJob && item.by ? (
            <HoverUserCard username={item.by}>
              <Link href={`/user/${item.by}`} className="hover:text-foreground">
                {item.by}
              </Link>
            </HoverUserCard>
          ) : null}
          <span title={item.time ? new Date(item.time * 1000).toISOString() : ""}>
            {item.time ? relativeTime(item.time) : ""}
          </span>
          <Link
            href={`/item/${item.id}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <MessageSquare className="size-3" />
            {item.descendants ?? 0}
          </Link>
          <NewReplyBadge storyId={item.id} currentDescendants={item.descendants ?? 0} />
          {historicalSnapshot ? null : <FavoriteButton itemId={item.id} loggedIn={loggedIn} />}
          <BookmarkButton
            kind="story"
            refId={String(item.id)}
            args={{
              storyId: item.id,
              title: item.title,
              url: item.url,
              by: item.by,
              time: item.time,
              score: item.score,
              descendants: item.descendants,
            }}
          />
        </footer>
      </div>
    </article>
  );
}
