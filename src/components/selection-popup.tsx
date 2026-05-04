"use client";

import { useToast } from "@/components/ui/toast";
import { saveHighlight } from "@/lib/bookmarks/store";
import { addHighlight } from "@/lib/highlight/store";
import { Bookmark, Copy, MessageSquareQuote, Search, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface PopupState {
  rect: DOMRect;
  text: string;
  storyId: number | null;
  commentId: number | null;
  charOffset: number;
  contextBefore: string;
  contextAfter: string;
}

const CTX = 16;

/**
 * Floating action menu over text selections inside `[data-hn-text]` regions.
 * Offers: Highlight, Reply quoting, Copy, Speak, Search HN.
 */
export function SelectionPopup() {
  const [state, setState] = React.useState<PopupState | null>(null);
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let suppressNext = false;

    function update() {
      if (suppressNext) {
        suppressNext = false;
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setState(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const container = (
        range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as Element)
          : range.startContainer.parentElement
      )?.closest<HTMLElement>("[data-hn-text]");
      if (!container) {
        setState(null);
        return;
      }
      const text = sel.toString();
      if (!text.trim()) {
        setState(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const commentEl = container.closest<HTMLElement>("[data-comment-id]");
      const storyEl = container.closest<HTMLElement>("[data-story-id]");
      const commentId = commentEl?.getAttribute("data-comment-id") ?? null;
      const storyId =
        commentEl?.getAttribute("data-story-id") ??
        storyEl?.getAttribute("data-story-id") ??
        deriveStoryFromUrl() ??
        null;

      // Compute char offset within the container's textContent.
      const containerText = container.textContent ?? "";
      const charOffset = computeCharOffset(container, range.startContainer, range.startOffset);
      const contextBefore = containerText.slice(Math.max(0, charOffset - CTX), charOffset);
      const contextAfter = containerText.slice(
        charOffset + text.length,
        charOffset + text.length + CTX,
      );

      setState({
        rect,
        text,
        storyId: storyId ? Number(storyId) : null,
        commentId: commentId ? Number(commentId) : null,
        charOffset,
        contextBefore,
        contextAfter,
      });
    }

    document.addEventListener("selectionchange", update);
    document.addEventListener("mouseup", update);
    document.addEventListener("touchend", update);
    const onScroll = () => setState(null);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        suppressNext = true;
        window.getSelection()?.removeAllRanges();
        setState(null);
      }
    });
    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("mouseup", update);
      document.removeEventListener("touchend", update);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  if (!state) return null;
  const { rect, text } = state;
  const top = Math.max(8, rect.top - 44);
  const left = Math.min(window.innerWidth - 280, Math.max(8, rect.left));

  const onHighlight = async () => {
    if (state.storyId == null) {
      toast.push("Highlight needs a story context", "error");
      return;
    }
    try {
      const rec = await addHighlight({
        storyId: state.storyId,
        commentId: state.commentId ?? undefined,
        text,
        charOffset: state.charOffset,
        contextBefore: state.contextBefore,
        contextAfter: state.contextAfter,
      });
      await saveHighlight({
        highlightId: rec.id,
        storyId: state.storyId,
        commentId: state.commentId ?? undefined,
        text,
        color: rec.color,
      });
      toast.push("Highlight saved", "success");
      setState(null);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Highlight failed", "error");
    }
  };

  const onReply = () => {
    const ev = new CustomEvent("hn:reply-prefill", {
      detail: { commentId: state.commentId, text: `> ${text.replace(/\n/g, "\n> ")}\n\n` },
    });
    window.dispatchEvent(ev);
    setState(null);
  };

  const onCopy = () => {
    navigator.clipboard.writeText(text).then(
      () => toast.push("Copied", "success"),
      () => toast.push("Copy failed", "error"),
    );
    setState(null);
  };

  const onSpeak = () => {
    if (typeof speechSynthesis === "undefined") {
      toast.push("Speech not supported", "error");
      return;
    }
    speechSynthesis.cancel();
    for (const para of text.split(/\n{2,}/)) {
      if (para.trim()) speechSynthesis.speak(new SpeechSynthesisUtterance(para));
    }
    setState(null);
  };

  const onSearch = () => {
    router.push(`/search?q=${encodeURIComponent(text.slice(0, 200))}`);
    setState(null);
  };

  return (
    <div
      role="menu"
      aria-label="Selection actions"
      style={{ position: "fixed", top, left, zIndex: 60 }}
      className="flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 shadow-lg"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Action label="Highlight" onClick={onHighlight} icon={<Bookmark className="size-3" />} />
      <Action
        label="Reply quoting"
        onClick={onReply}
        icon={<MessageSquareQuote className="size-3" />}
      />
      <Action label="Copy" onClick={onCopy} icon={<Copy className="size-3" />} />
      <Action label="Speak" onClick={onSpeak} icon={<Volume2 className="size-3" />} />
      <Action label="Search HN" onClick={onSearch} icon={<Search className="size-3" />} />
    </div>
  );
}

function Action({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function computeCharOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n === node) return acc + offset;
    acc += n.nodeValue?.length ?? 0;
    n = walker.nextNode();
  }
  return acc;
}

function deriveStoryFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/^\/item\/(\d+)/);
  return m ? m[1] : null;
}
