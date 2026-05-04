"use client";

import { Comment } from "@/components/comment";
import { ControlPad } from "@/components/control-pad";
import { HighlightOverlay } from "@/components/highlight-overlay";
import { MarkVisited } from "@/components/mark-visited";
import type { CommentNode } from "@/lib/hn/types";
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

  return (
    <>
      <MarkVisited storyId={storyId} commentIds={allIds} onLastVisited={setLastVisitedAt} />
      <HighlightOverlay storyId={storyId} />
      <ControlPad scope="item" />
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
          />
        ))
      )}
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
