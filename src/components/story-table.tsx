"use client";

import { BookmarkButton } from "@/components/bookmark-button";
import { DomainFavicon } from "@/components/domain-favicon";
import { HoverUserCard } from "@/components/hover-user-card";
import { VoteButton } from "@/components/vote-button";
import type { RawItem } from "@/lib/hn/types";
import type { ColumnId } from "@/lib/index-view/store";
import { relativeTime } from "@/lib/time";
import { cn, hostFromUrl } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

const HEADERS: Record<ColumnId, string> = {
  rank: "#",
  score: "Score",
  title: "Title",
  host: "Site",
  by: "By",
  age: "Age",
  comments: "Cmts",
  type: "Type",
  pph: "Pts/h",
};

export function StoryTable({
  items,
  columns,
  baseRank = 1,
  loggedIn,
}: {
  items: RawItem[];
  columns: ColumnId[];
  baseRank?: number;
  loggedIn: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm tabular-nums">
        <thead className="bg-card/95">
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {columns.map((c) => (
              <th
                key={c}
                className={cn(
                  "border-b border-border px-3 py-2 font-medium",
                  c === "title" && "min-w-[16rem]",
                  (c === "score" || c === "comments" || c === "rank" || c === "pph") &&
                    "text-right",
                )}
              >
                {HEADERS[c]}
              </th>
            ))}
            <th className="w-px border-b border-border px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const host = hostFromUrl(item.url);
            const isExternal = item.url != null;
            const internalUrl = item.url ?? `/item/${item.id}`;
            const ageHours = item.time ? (Date.now() / 1000 - item.time) / 3600 : null;
            const pph =
              item.score != null && ageHours != null && ageHours > 0
                ? Math.round((item.score / ageHours) * 10) / 10
                : null;
            return (
              <tr
                key={item.id}
                className="border-b border-border/60 transition-colors hover:bg-accent/40"
              >
                {columns.map((c) => {
                  switch (c) {
                    case "rank":
                      return (
                        <td key={c} className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {baseRank + i}
                        </td>
                      );
                    case "score":
                      return (
                        <td key={c} className="px-3 py-2 text-right">
                          <VoteButton
                            itemId={item.id}
                            initialScore={item.score ?? null}
                            loggedIn={loggedIn}
                            size="sm"
                            compact
                          />
                        </td>
                      );
                    case "title":
                      return (
                        <td key={c} className="px-3 py-2">
                          <a
                            href={internalUrl}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            className="font-medium hover:underline"
                          >
                            {item.title ?? "(no title)"}
                          </a>
                        </td>
                      );
                    case "host":
                      return (
                        <td key={c} className="px-3 py-2 text-xs text-muted-foreground">
                          {host ? (
                            <span className="inline-flex items-center gap-1">
                              <DomainFavicon domain={host} />
                              {host}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    case "by":
                      return (
                        <td key={c} className="px-3 py-2 text-xs text-muted-foreground">
                          {item.by ? (
                            <HoverUserCard username={item.by}>
                              <Link href={`/user/${item.by}`} className="hover:text-foreground">
                                {item.by}
                              </Link>
                            </HoverUserCard>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    case "age":
                      return (
                        <td
                          key={c}
                          className="px-3 py-2 text-xs text-muted-foreground"
                          title={item.time ? new Date(item.time * 1000).toISOString() : ""}
                        >
                          {item.time ? relativeTime(item.time) : "—"}
                        </td>
                      );
                    case "comments":
                      return (
                        <td key={c} className="px-3 py-2 text-right text-xs">
                          <Link
                            href={`/item/${item.id}`}
                            className="inline-flex items-center justify-end gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <MessageSquare className="size-3" />
                            {item.descendants ?? 0}
                          </Link>
                        </td>
                      );
                    case "type":
                      return (
                        <td key={c} className="px-3 py-2 text-xs text-muted-foreground">
                          {item.type ?? "story"}
                        </td>
                      );
                    case "pph":
                      return (
                        <td key={c} className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {pph ?? "—"}
                        </td>
                      );
                    default:
                      return null;
                  }
                })}
                <td className="px-3 py-2 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
