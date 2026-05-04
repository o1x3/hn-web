"use client";

import { LoginDialog } from "@/components/login-dialog";
import { useToast } from "@/components/ui/toast";
import { voteAction } from "@/lib/hn/actions";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import * as React from "react";

export function VoteButton({
  itemId,
  initialScore,
  loggedIn,
  size = "md",
}: {
  itemId: number;
  initialScore: number | null;
  loggedIn: boolean;
  size?: "sm" | "md";
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
    if (busy || voted) return;

    setBusy(true);
    setVoted(true);
    setScore((s) => (s == null ? s : s + 1));
    try {
      const res = await voteAction(itemId, "up");
      if (!res.ok) {
        setVoted(false);
        setScore((s) => (s == null ? s : s - 1));
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
        disabled={busy}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
          voted && "text-[hsl(var(--color-upvote))]",
        )}
      >
        <ChevronUp className={dim} strokeWidth={2.4} />
        {score != null ? (
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
