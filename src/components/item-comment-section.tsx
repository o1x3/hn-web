"use client";

import { Comment } from "@/components/comment";
import { ControlPad } from "@/components/control-pad";
import { HighlightOverlay } from "@/components/highlight-overlay";
import { MarkVisited } from "@/components/mark-visited";
import { ThreadNewBar } from "@/components/thread-new-bar";
import type { CommentNode } from "@/lib/hn/types";
import { buildHasNewSet, collectNewIds } from "@/lib/replies/new-comments";
import * as React from "react";

/**
 * Wraps the comment tree in a client island that owns the visit state
 * (F2 lastVisitedAt → orange ↑ markers), the highlight overlay (F3), and
 * the control pad mount toggle (F6).
 */
export function ItemCommentSection({
  storyId,
  comments,
  loggedIn,
  showDead,
}: {
  storyId: number;
  comments: CommentNode[];
  loggedIn: boolean;
  showDead: boolean;
}) {
  const [lastVisitedAt, setLastVisitedAt] = React.useState<number | null>(null);
  const allIds = React.useMemo(() => collectIds(comments), [comments]);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const hasNewSet = React.useMemo(
    () => buildHasNewSet(comments, lastVisitedAt),
    [comments, lastVisitedAt],
  );
  const newCount = React.useMemo(
    () => collectNewIds(comments, lastVisitedAt).length,
    [comments, lastVisitedAt],
  );

  return (
    <>
      <MarkVisited storyId={storyId} commentIds={allIds} onLastVisited={setLastVisitedAt} />
      <HighlightOverlay storyId={storyId} />
      <ControlPad scope="item" />
      <ThreadNewBar count={newCount} rootRef={wrapperRef} />
      <div ref={wrapperRef}>
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <Comment
              key={c.id}
              node={c}
              depth={0}
              loggedIn={loggedIn}
              showDead={showDead}
              lastVisitedAt={lastVisitedAt ?? undefined}
              storyId={storyId}
              hasNewSet={hasNewSet}
            />
          ))
        )}
      </div>
    </>
  );
}

function collectIds(nodes: CommentNode[]): number[] {
  const out: number[] = [];
  for (const n of nodes) {
    out.push(n.id);
    if (n.children.length) out.push(...collectIds(n.children));
  }
  return out;
}
