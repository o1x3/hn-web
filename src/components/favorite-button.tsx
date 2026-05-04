"use client";

import { LoginDialog } from "@/components/login-dialog";
import { useToast } from "@/components/ui/toast";
import { favoriteAction } from "@/lib/hn/actions";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import * as React from "react";

export function FavoriteButton({
  itemId,
  loggedIn,
}: {
  itemId: number;
  loggedIn: boolean;
}) {
  const [on, setOn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const toast = useToast();

  async function onClick() {
    if (!loggedIn) {
      setLoginOpen(true);
      return;
    }
    if (busy) return;
    const next = !on;
    setBusy(true);
    setOn(next);
    try {
      const res = await favoriteAction(itemId, next);
      if (!res.ok) {
        setOn(!next);
        toast.push(res.error, "error");
        if (res.needsLogin) setLoginOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={on}
        aria-label={on ? "Unfavorite" : "Favorite"}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
          on && "text-yellow-500",
        )}
      >
        <Star className={cn("size-3.5", on && "fill-current")} />
        {on ? "favorited" : "favorite"}
      </button>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
