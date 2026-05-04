"use client";

import { navParent, navSibling, navTopLevel } from "@/components/control-pad";
import { ShortcutHelp } from "@/components/shortcut-help";
import { useRouter } from "next/navigation";
import * as React from "react";
import { tinykeys } from "tinykeys";

/**
 * Global keyboard shortcuts. Selection state lives in `data-selectable`
 * elements (story rows). j/k navigate, o opens the URL, c opens comments,
 * u upvotes, r focuses reply, ? shows help.
 *
 * Comment-tree (F6): J/K next/prev top-level, H/L sibling, P parent,
 * [ / ] collapse/expand subtree.
 *
 * F2: n / Shift+n jump to next/prev `[data-new="true"]` comment.
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

  const jumpNew = React.useCallback((delta: number) => {
    const news = Array.from(document.querySelectorAll<HTMLElement>("[data-new='true']"));
    if (news.length === 0) return;
    const cur = document.querySelector<HTMLElement>("[data-control-cursor='true']");
    const idx = cur ? news.indexOf(cur) : -1;
    const next =
      idx === -1
        ? delta > 0
          ? 0
          : news.length - 1
        : Math.max(0, Math.min(news.length - 1, idx + delta));
    const target = news[next];
    if (!target) return;
    for (const e of Array.from(
      document.querySelectorAll<HTMLElement>("[data-control-cursor='true']"),
    )) {
      e.removeAttribute("data-control-cursor");
    }
    target.setAttribute("data-control-cursor", "true");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const collapseSubtree = React.useCallback((expand: boolean) => {
    const cur = document.querySelector<HTMLElement>("[data-control-cursor='true']");
    if (!cur) return;
    const id = cur.getAttribute("data-comment-id");
    if (!id) return;
    // Toggle the cursor's own header collapse button.
    const btn = cur.querySelector<HTMLButtonElement>("button[aria-expanded]");
    if (btn && btn.getAttribute("aria-expanded") === (expand ? "false" : "true")) btn.click();
    // Subtree: walk descendants by data-parent-id chain.
    const stack = [id];
    const visited = new Set<string>();
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || visited.has(cur)) continue;
      visited.add(cur);
      const children = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-parent-id='${cur}'][data-comment-id]`),
      );
      for (const child of children) {
        const cb = child.querySelector<HTMLButtonElement>("button[aria-expanded]");
        if (cb && cb.getAttribute("aria-expanded") === (expand ? "false" : "true")) cb.click();
        const cid = child.getAttribute("data-comment-id");
        if (cid) stack.push(cid);
      }
    }
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
      "Shift+J": () => navTopLevel(1),
      "Shift+K": () => navTopLevel(-1),
      "Shift+H": () => navSibling(-1),
      "Shift+L": () => navSibling(1),
      "Shift+P": () => navParent(),
      "[": () => collapseSubtree(false),
      "]": () => collapseSubtree(true),
      n: () => jumpNew(1),
      "Shift+N": () => jumpNew(-1),
      "Shift+?": () => setHelpOpen(true),
      "?": () => setHelpOpen(true),
    });
    return () => u();
  }, [move, currentItem, router, jumpNew, collapseSubtree]);

  return <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />;
}
