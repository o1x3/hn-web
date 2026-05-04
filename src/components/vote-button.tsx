"use client";

import { LoginDialog } from "@/components/login-dialog";
import { useToast } from "@/components/ui/toast";
import { voteAction } from "@/lib/hn/actions";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import * as React from "react";

/**
 * Vote toggle. Click while not voted → upvote; click while voted → unvote.
 * Score updates optimistically and rolls back on error.
 *
 * Used for both stories and comments via `compact` (just the chevron, no score).
 */
export function VoteButton({
  itemId,
  initialScore,
  loggedIn,
  size = "md",
  compact = false,
}: {
  itemId: number;
  initialScore: number | null;
  loggedIn: boolean;
  size?: "sm" | "md";
  /** Compact: omit the score line (used in comment headers). */
  compact?: boolean;
}) {
  const [voted, setVoted] = React.useState(false);
  const [score, setScore] = React.useState<number | null>(initialScore);
  const [busy, setBusy] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const toast = useToast();

  async function onClick() {
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }
    if (busy) return;

    const dir: "up" | "un" = voted ? "un" : "up";
    const delta = dir === "up" ? 1 : -1;

    setBusy(true);
    setVoted(!voted);
    setScore((s) => (s == null ? s : s + delta));
    try {
      const res = await voteAction(itemId, dir);
      if (!res.ok) {
        // Roll back on failure
        setVoted(voted);
        setScore((s) => (s == null ? s : s - delta));
        toast.push(res.error, "error");
        if (res.needsLogin) setLoginOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const dim = size === "sm" ? "size-4" : "size-5";
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={voted}
        aria-label={voted ? "Upvoted" : "Upvote"}
        title={voted ? "Click to unvote" : "Upvote"}
        disabled={busy}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
          voted && "text-[hsl(var(--color-upvote))]",
        )}
      >
        <ChevronUp className={dim} strokeWidth={2.4} />
        {!compact && score != null ? (
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              voted ? "text-[hsl(var(--color-upvote))]" : "",
            )}
          >
            {score}
          </span>
        ) : null}
      </button>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
