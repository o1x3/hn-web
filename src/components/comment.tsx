"use client";

import { BookmarkButton } from "@/components/bookmark-button";
import { HoverUserCard } from "@/components/hover-user-card";
import { ReplyForm } from "@/components/reply-form";
import { VoteButton } from "@/components/vote-button";
import type { CommentNode } from "@/lib/hn/types";
import { usePref } from "@/lib/idb/prefs";
import { idbDelete, idbPut, useById } from "@/lib/idb/use-store";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";

/**
 * Recursive collapsible comment.
 *
 * Collapse controls:
 *   - Header chevron: collapses THIS comment (own subtree).
 *   - Left rail (the guide-line on a child's left edge): collapses the
 *     PARENT — the comment whose reply column the rail visually belongs to.
 *     Sibling rails at the same depth all call the same parent toggle, so
 *     the visually-continuous rail acts as one click target.
 *
 * F2: when `lastVisitedAt` is set, comments newer than that timestamp are
 * marked with a `↑` indicator and `data-new="true"` for `n`/`Shift+n` jumps.
 * The orange dot bubbles up onto a collapsed parent via `bubbledNew`.
 *
 * F3/F6: emits `data-comment-id`, `data-depth`, `data-parent-id`,
 * `data-story-id` so the highlight overlay and control pad can navigate.
 */
export function Comment({
  node,
  depth,
  loggedIn,
  showDead,
  lastVisitedAt,
  storyId,
  parentId,
  hasNewSet,
  onCollapseParent,
}: {
  node: CommentNode;
  depth: number;
  loggedIn: boolean;
  showDead: boolean;
  /** Unix seconds; comments newer than this get the new-reply marker. */
  lastVisitedAt?: number;
  /** Pass-through so the comment knows which story it belongs to. */
  storyId?: number;
  /** Pass-through so the control-pad can find the parent in O(1). */
  parentId?: number;
  /** Ids that are themselves new or are ancestors of a new comment. */
  hasNewSet?: Set<number>;
  /** Toggle the parent's collapsed state — called when this comment's rail
   * is clicked. The rail belongs to the parent's reply column. */
  onCollapseParent?: () => void;
}) {
  const collapseDepthPref = usePref<number | null>("comments.autoCollapseDepth");
  const persistPref = usePref<boolean>("comments.persistCollapse");
  const persistEnabled = persistPref ?? true;
  const collapseKey = persistEnabled && storyId ? `${storyId}:${node.id}` : null;
  const persisted = useById("collapsedThreads", collapseKey);
  const persistLoaded = !persisted.isLoading;
  const initialCollapsed = React.useMemo(() => {
    if (collapseDepthPref != null && depth > collapseDepthPref) return true;
    return false;
  }, [collapseDepthPref, depth]);

  const [collapsed, setCollapsedRaw] = React.useState(initialCollapsed);
  const [hydrated, setHydrated] = React.useState(false);
  const [showReply, setShowReply] = React.useState(false);

  // Apply persisted collapse once IDB read returns.
  React.useEffect(() => {
    if (!hydrated && persistLoaded) {
      if (persisted.data) setCollapsedRaw(true);
      else setCollapsedRaw(initialCollapsed);
      setHydrated(true);
    }
  }, [hydrated, persistLoaded, persisted.data, initialCollapsed]);

  const setCollapsed = React.useCallback(
    (next: boolean | ((p: boolean) => boolean)) => {
      setCollapsedRaw((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (collapseKey && storyId) {
          if (value) {
            idbPut("collapsedThreads", {
              id: collapseKey,
              storyId,
              commentId: node.id,
              collapsedAt: Date.now(),
            }).catch(() => {});
          } else {
            idbDelete("collapsedThreads", collapseKey).catch(() => {});
          }
        }
        return value;
      });
    },
    [collapseKey, storyId, node.id],
  );

  if ((node.dead || node.deleted) && !showDead) return null;

  // Slightly tighter than the 12px we shipped originally — keeps deeply
  // nested threads readable on phones without giving up the visual hierarchy
  // on desktop.
  const indent = Math.min(depth, 8) * 8;
  const childCount = countDescendants(node.children);
  const isNew =
    typeof lastVisitedAt === "number" && lastVisitedAt > 0 && node.createdAt * 1000 > lastVisitedAt;
  const newInSubtree = collapsed ? countNewInSubtree(node.children, lastVisitedAt) : 0;
  const bubbledNew = collapsed && newInSubtree > 0;

  return (
    <article
      data-comment-id={node.id}
      data-depth={depth}
      data-parent-id={parentId ?? ""}
      data-story-id={storyId ?? ""}
      data-new={isNew ? "true" : undefined}
      data-has-new={hasNewSet?.has(node.id) ? "true" : undefined}
      className={cn(
        "group relative",
        depth > 0 && "border-l border-border/60 hover:border-border",
        isNew && "is-new-reply",
      )}
      style={{ paddingLeft: depth > 0 ? 12 : 0, marginLeft: depth > 0 ? indent : 0 }}
    >
      {/* Rail click target: collapses the PARENT (the comment whose reply
       * column this rail visually belongs to). Sibling rails at the same
       * depth all call the same parent toggle, so the visually-continuous
       * rail behaves as one. */}
      {depth > 0 && onCollapseParent ? (
        <button
          type="button"
          aria-label="Collapse parent thread"
          onClick={onCollapseParent}
          className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-pointer opacity-0 hover:opacity-100"
        />
      ) : null}

      <header className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground py-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand comment thread" : "Collapse comment thread"}
          className="inline-flex items-center gap-1 rounded px-1 hover:bg-accent"
        >
          <ChevronDown className={cn("size-3 transition-transform", collapsed && "-rotate-90")} />
        </button>
        {!node.dead && !node.deleted ? (
          <VoteButton itemId={node.id} initialScore={null} loggedIn={loggedIn} size="sm" compact />
        ) : null}
        {isNew ? (
          <span
            className="inline-flex h-4 items-center rounded bg-primary/15 px-1.5 text-[10px] font-medium uppercase tracking-wide text-primary"
            title="New since your last visit"
          >
            ↑ new
          </span>
        ) : null}
        {node.author ? (
          <HoverUserCard username={node.author}>
            <Link
              href={`/user/${node.author}`}
              className="font-medium text-foreground hover:underline"
            >
              {node.author}
            </Link>
          </HoverUserCard>
        ) : (
          <span>[deleted]</span>
        )}
        <span aria-hidden>·</span>
        <span title={new Date(node.createdAt * 1000).toISOString()}>
          {relativeTime(node.createdAt)}
        </span>
        {collapsed && childCount > 0 ? (
          <span className="text-muted-foreground">
            ({childCount} {childCount === 1 ? "reply" : "replies"})
          </span>
        ) : null}
        {bubbledNew ? (
          <span
            className="inline-flex h-4 items-center rounded bg-primary/15 px-1.5 text-[10px] font-medium uppercase tracking-wide text-primary"
            title={`${newInSubtree} new in this subtree`}
          >
            +{newInSubtree} new
          </span>
        ) : null}
        {(node.dead || node.deleted) && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {node.deleted ? "deleted" : "dead"}
          </span>
        )}
        <BookmarkButton
          className="ml-auto"
          kind="comment"
          refId={String(node.id)}
          args={{
            commentId: node.id,
            storyId,
            author: node.author ?? undefined,
            textHtml: node.textHtml,
            time: node.createdAt,
            permalink: `/item/${node.id}`,
          }}
        />
      </header>

      {!collapsed ? (
        <>
          <div
            data-hn-text
            className="hn-text text-sm py-1"
            // Sanitized at the boundary in firebase/algolia. Defensive sanitize again.
            dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(node.textHtml) }}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground py-1">
            <button
              type="button"
              data-action="reply"
              onClick={() => setShowReply((s) => !s)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <MessageCircle className="size-3" />
              Reply
            </button>
            <Link
              href={`/item/${node.id}`}
              className="hover:text-foreground"
              title="Permalink"
              aria-label={`Permalink to comment ${node.id}`}
            >
              link
            </Link>
          </div>
          {showReply ? <ReplyForm parentId={node.id} loggedIn={loggedIn} compact /> : null}
          {node.children.length > 0 ? (
            <div className="mt-1">
              {node.children.map((child) => (
                <Comment
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  loggedIn={loggedIn}
                  showDead={showDead}
                  lastVisitedAt={lastVisitedAt}
                  storyId={storyId}
                  parentId={node.id}
                  hasNewSet={hasNewSet}
                  onCollapseParent={() => setCollapsed((c) => !c)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

function countDescendants(nodes: CommentNode[]): number {
  let n = 0;
  for (const c of nodes) n += 1 + countDescendants(c.children);
  return n;
}

function countNewInSubtree(nodes: CommentNode[], lastVisitedAt?: number): number {
  if (!lastVisitedAt) return 0;
  let n = 0;
  for (const c of nodes) {
    if (c.createdAt * 1000 > lastVisitedAt) n += 1;
    n += countNewInSubtree(c.children, lastVisitedAt);
  }
  return n;
}
