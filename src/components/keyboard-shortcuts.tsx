"use client";

import { ShortcutHelp } from "@/components/shortcut-help";
import { useRouter } from "next/navigation";
import * as React from "react";
import { tinykeys } from "tinykeys";

/**
 * Global keyboard shortcuts. Selection state lives in `data-selectable`
 * elements (story rows). j/k navigate, o opens the URL, c opens comments,
 * u upvotes, r focuses reply, ? shows help.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = React.useState(false);
  const indexRef = React.useRef<number>(-1);

  const move = React.useCallback((delta: number) => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-selectable]"));
    if (items.length === 0) return;
    const next = Math.max(0, Math.min(items.length - 1, indexRef.current + delta));
    indexRef.current = next;
    for (const el of items) el.removeAttribute("data-selected");
    const target = items[next];
    target.setAttribute("data-selected", "true");
    target.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const currentItem = React.useCallback(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-selectable]"));
    return items[indexRef.current] ?? null;
  }, []);

  React.useEffect(() => {
    const u = tinykeys(window, {
      j: () => move(1),
      k: () => move(-1),
      o: () => {
        const el = currentItem();
        const url = el?.getAttribute("data-href");
        if (url) window.open(url, "_blank", "noopener");
      },
      c: () => {
        const el = currentItem();
        const id = el?.getAttribute("data-id");
        if (id) router.push(`/item/${id}`);
      },
      u: () => {
        const el = currentItem();
        const btn = el?.querySelector<HTMLButtonElement>(
          "[aria-label='Upvote'], [aria-label='Upvoted']",
        );
        btn?.click();
      },
      r: () => {
        const el = currentItem();
        const btn = el?.querySelector<HTMLButtonElement>("button[data-action='reply']");
        btn?.click();
      },
      "Shift+?": () => setHelpOpen(true),
      "?": () => setHelpOpen(true),
    });
    return () => u();
  }, [move, currentItem, router]);

  return <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />;
}
