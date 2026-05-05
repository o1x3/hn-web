"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { hideStory } from "@/lib/hidden/store";
import { flagAction, hideAction } from "@/lib/hn/actions";
import { Eye, EyeOff, Flag, Link2, MoreHorizontal } from "lucide-react";
import * as React from "react";

export function StoryOverflowMenu({
  itemId,
  loggedIn,
  storyUrl,
}: {
  itemId: number;
  loggedIn: boolean;
  storyUrl?: string | null;
}) {
  const toast = useToast();

  const onHide = async () => {
    await hideStory(itemId);
    if (loggedIn) {
      const res = await hideAction(itemId);
      if (!res.ok) {
        toast.push("Hidden locally only — HN sync failed", "default");
        return;
      }
    }
    toast.push("Hidden", "success");
  };

  const onFlag = async () => {
    if (!loggedIn) {
      toast.push("Sign in to flag", "default");
      return;
    }
    if (!confirm("Flag this story?")) return;
    const res = await flagAction(itemId);
    toast.push(res.ok ? "Flagged" : `Flag failed: ${res.error}`, res.ok ? "success" : "error");
  };

  const onCopyLink = async () => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/item/${itemId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.push("Link copied", "success");
    } catch {
      toast.push("Couldn't copy", "error");
    }
  };

  const onCopySource = async () => {
    if (!storyUrl) return;
    try {
      await navigator.clipboard.writeText(storyUrl);
      toast.push("Source URL copied", "success");
    } catch {
      toast.push("Couldn't copy", "error");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More actions"
        className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onCopyLink}>
          <Link2 className="mr-2 size-3.5" /> Copy thread link
        </DropdownMenuItem>
        {storyUrl ? (
          <DropdownMenuItem onClick={onCopySource}>
            <Link2 className="mr-2 size-3.5" /> Copy source URL
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHide}>
          <EyeOff className="mr-2 size-3.5" /> Hide
        </DropdownMenuItem>
        {loggedIn ? (
          <DropdownMenuItem onClick={onFlag} className="text-destructive">
            <Flag className="mr-2 size-3.5" /> Flag
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <Eye className="mr-2 size-3.5" /> Sign in to flag
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
