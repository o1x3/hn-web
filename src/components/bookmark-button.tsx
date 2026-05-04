"use client";

import { useToast } from "@/components/ui/toast";
import {
  type SaveCommentArgs,
  type SaveStoryArgs,
  type SaveUserArgs,
  getByTarget,
  removeByTarget,
  saveComment,
  saveStory,
  saveUser,
} from "@/lib/bookmarks/store";
import type { BookmarkKind } from "@/lib/idb/schema";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import * as React from "react";

type Variant =
  | { kind: "story"; args: SaveStoryArgs; refId: string }
  | { kind: "comment"; args: SaveCommentArgs; refId: string }
  | { kind: "user"; args: SaveUserArgs; refId: string };

/**
 * Shared bookmark toggle. Used in StoryCard, Comment, HoverUserCard, and the
 * F5 selection popup. All-local IDB write — no network.
 */
export function BookmarkButton(
  props: Variant & {
    size?: "sm" | "md";
    showLabel?: boolean;
    className?: string;
  },
) {
  const [saved, setSaved] = React.useState<boolean | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    let cancelled = false;
    getByTarget(props.kind as BookmarkKind, props.refId)
      .then((b) => {
        if (!cancelled) setSaved(!!b);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [props.kind, props.refId]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (saved) {
        await removeByTarget(props.kind as BookmarkKind, props.refId);
        setSaved(false);
        toast.push("Bookmark removed", "default");
      } else {
        if (props.kind === "story") await saveStory(props.args);
        else if (props.kind === "comment") await saveComment(props.args);
        else await saveUser(props.args);
        setSaved(true);
        toast.push("Bookmarked", "success");
      }
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Bookmark failed", "error");
    }
  };

  const label = saved ? "Remove bookmark" : "Bookmark";
  const iconSize = props.size === "md" ? "size-4" : "size-3";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={!!saved}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
        saved && "text-primary hover:text-primary/80",
        props.className,
      )}
    >
      <Bookmark className={cn(iconSize, saved && "fill-current")} />
      {props.showLabel ? <span className="text-xs">{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
