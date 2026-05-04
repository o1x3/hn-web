"use client";

import { HoverUserCard } from "@/components/hover-user-card";
import { ReplyForm } from "@/components/reply-form";
import type { CommentNode } from "@/lib/hn/types";
import { sanitizeHnHtml } from "@/lib/sanitize";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";

/**
 * Recursive collapsible comment.
 *
 * Reddit signature: clicking the vertical guide-line (left rail) collapses
 * the subtree. Also clickable header-collapse with `[-]` indicator.
 */
export function Comment({
  node,
  depth,
  loggedIn,
  showDead,
}: {
  node: CommentNode;
  depth: number;
  loggedIn: boolean;
  showDead: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showReply, setShowReply] = React.useState(false);

  if ((node.dead || node.deleted) && !showDead) return null;

  const indent = Math.min(depth, 8) * 12;
  const childCount = countDescendants(node.children);

  return (
    <article
      className={cn("group relative", depth > 0 && "border-l border-border/60 hover:border-border")}
      style={{ paddingLeft: depth > 0 ? 12 : 0, marginLeft: depth > 0 ? indent : 0 }}
    >
      {/* Click target along the guide-line collapses subtree. */}
      {depth > 0 ? (
        <button
          type="button"
          aria-label={collapsed ? "Expand thread" : "Collapse thread"}
          onClick={() => setCollapsed((c) => !c)}
          className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-pointer opacity-0 hover:opacity-100"
        />
      ) : null}

      <header className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground py-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1 rounded px-1 hover:bg-accent"
        >
          <ChevronDown className={cn("size-3 transition-transform", collapsed && "-rotate-90")} />
        </button>
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
        {(node.dead || node.deleted) && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {node.deleted ? "deleted" : "dead"}
          </span>
        )}
      </header>

      {!collapsed ? (
        <>
          <div
            className="hn-text text-sm py-1"
            // Sanitized at the boundary in firebase/algolia. Defensive sanitize again.
            dangerouslySetInnerHTML={{ __html: sanitizeHnHtml(node.textHtml) }}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground py-1">
            <button
              type="button"
              onClick={() => setShowReply((s) => !s)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <MessageCircle className="size-3" />
              Reply
            </button>
            <Link href={`/item/${node.id}`} className="hover:text-foreground" title="Permalink">
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
