"use client";

import { Button } from "@/components/ui/button";
import { getPref, setPref, usePref } from "@/lib/idb/prefs";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  CornerUpLeft,
  Home,
} from "lucide-react";
import * as React from "react";

type Mode = "always" | "auto" | "hide";
const POS_KEY = "controlPad.pos";
const MODE_KEY = "controlPad.mode";

interface Pos {
  x: number;
  y: number;
}

/**
 * Floating control panel for navigating comment trees and the page.
 * Reads `[data-comment-id][data-depth][data-parent-id]` markers emitted by
 * `Comment`. Coexists with `KeyboardShortcuts` (capital J/K/H/L vs. lower).
 *
 * Drag to reposition; position persisted in IDB `prefs` store.
 */
export function ControlPad({ scope = "item" }: { scope?: "item" | "global" }) {
  const mode = (usePref<Mode>(MODE_KEY) ?? "auto") as Mode;
  const [pos, setPos] = React.useState<Pos>({ x: 16, y: 16 });
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getPref<Pos>(POS_KEY).then((p) => {
      if (!cancelled && p) setPos(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "hide") return null;
  if (mode === "auto" && scope === "global") return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-drag-handle]")) return;
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const w = ref.current?.offsetWidth ?? 200;
      const h = ref.current?.offsetHeight ?? 200;
      const maxX = window.innerWidth - w - 8;
      const maxY = window.innerHeight - h - 8;
      setPos({
        x: Math.max(8, Math.min(maxX, startPos.x + dx)),
        y: Math.max(8, Math.min(maxY, startPos.y + dy)),
      });
    };
    const up = (ev: PointerEvent) => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const finalPos = {
        x: Math.max(8, startPos.x + (ev.clientX - startX)),
        y: Math.max(8, startPos.y + (ev.clientY - startY)),
      };
      setPref(POS_KEY, finalPos).catch(() => {});
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Comment navigation"
      onPointerDown={onPointerDown}
      style={{ right: pos.x, bottom: pos.y, position: "fixed" }}
      className={cn(
        "z-40 grid grid-cols-3 gap-0.5 rounded-md border border-border bg-card p-1 shadow-lg select-none",
        dragging && "ring-2 ring-primary",
      )}
    >
      <div
        data-drag-handle
        className="col-span-3 -mb-1 mt-0 cursor-grab text-center text-[10px] text-muted-foreground hover:text-foreground"
        title="Drag to reposition"
      >
        ⋮⋮
      </div>
      <PadButton aria-label="Previous top-level" onClick={() => navTopLevel(-1)}>
        <ArrowUp className="size-3" />
      </PadButton>
      <PadButton aria-label="Next top-level" onClick={() => navTopLevel(1)}>
        <ArrowDown className="size-3" />
      </PadButton>
      <PadButton aria-label="Parent comment" onClick={navParent}>
        <CornerUpLeft className="size-3" />
      </PadButton>
      <PadButton aria-label="Previous sibling" onClick={() => navSibling(-1)}>
        <ArrowLeft className="size-3" />
      </PadButton>
      <PadButton aria-label="Next sibling" onClick={() => navSibling(1)}>
        <ArrowRight className="size-3" />
      </PadButton>
      <PadButton
        aria-label="Jump to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Home className="size-3" />
      </PadButton>
      <PadButton aria-label="Collapse all" onClick={collapseAll}>
        <ChevronsUp className="size-3" />
      </PadButton>
      <PadButton aria-label="Expand all" onClick={expandAll}>
        <ChevronsDown className="size-3" />
      </PadButton>
      <PadButton
        aria-label="Jump to bottom"
        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
      >
        <ArrowDown className="size-3" />
      </PadButton>
    </div>
  );
}

function PadButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" {...rest}>
      {children}
    </Button>
  );
}

/** Find the currently focused comment via `[data-control-cursor]` or pick the first visible. */
function getCursorComment(): HTMLElement | null {
  const cursor = document.querySelector<HTMLElement>("[data-control-cursor='true']");
  if (cursor) return cursor;
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-comment-id]"));
  for (const c of all) {
    const r = c.getBoundingClientRect();
    if (r.bottom > 80) return c;
  }
  return all[0] ?? null;
}

function setCursor(el: HTMLElement | null) {
  for (const e of Array.from(
    document.querySelectorAll<HTMLElement>("[data-control-cursor='true']"),
  )) {
    e.removeAttribute("data-control-cursor");
  }
  if (el) {
    el.setAttribute("data-control-cursor", "true");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

export function navTopLevel(delta: number) {
  const tops = Array.from(
    document.querySelectorAll<HTMLElement>("[data-comment-id][data-depth='0']"),
  );
  if (tops.length === 0) return;
  const cur = getCursorComment();
  const curTop = cur?.closest<HTMLElement>("[data-depth='0']") ?? null;
  const idx = curTop ? tops.indexOf(curTop) : -1;
  const next = Math.max(0, Math.min(tops.length - 1, (idx === -1 ? 0 : idx) + delta));
  setCursor(tops[next] ?? null);
}

export function navSibling(delta: number) {
  const cur = getCursorComment();
  if (!cur) return;
  const parentId = cur.getAttribute("data-parent-id") ?? "";
  const depth = cur.getAttribute("data-depth") ?? "";
  const siblings = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-comment-id][data-parent-id='${cssEscape(parentId)}'][data-depth='${cssEscape(depth)}']`,
    ),
  );
  if (siblings.length === 0) return;
  const idx = siblings.indexOf(cur);
  const next = Math.max(0, Math.min(siblings.length - 1, (idx === -1 ? 0 : idx) + delta));
  setCursor(siblings[next] ?? null);
}

export function navParent() {
  const cur = getCursorComment();
  if (!cur) return;
  const parentId = cur.getAttribute("data-parent-id");
  if (!parentId) return;
  const parent = document.querySelector<HTMLElement>(`[data-comment-id='${cssEscape(parentId)}']`);
  setCursor(parent);
}

function collapseAll() {
  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>("button[aria-expanded='true']"),
  )) {
    (el as HTMLButtonElement).click();
  }
}

function expandAll() {
  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>("button[aria-expanded='false']"),
  )) {
    (el as HTMLButtonElement).click();
  }
}

function cssEscape(s: string): string {
  // Minimal: quote-escape; values are numeric/empty so this is safe.
  return s.replace(/'/g, "\\'");
}
