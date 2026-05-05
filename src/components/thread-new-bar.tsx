"use client";

import { ArrowDown } from "lucide-react";
import * as React from "react";
import { tinykeys } from "tinykeys";

/**
 * Sits above the comment tree when there are new comments since last visit.
 * Shows the count, a "jump to first new" button, and a "show only new"
 * toggle. The keyboard shortcut `.` toggles the filter while this bar is
 * mounted (i.e. only on threads that actually have new comments).
 *
 * Filtering is implemented in CSS via `data-only-new` on the wrapper plus
 * `data-has-new` on each comment article.
 */
export function ThreadNewBar({
  count,
  rootRef,
}: {
  count: number;
  rootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [onlyNew, setOnlyNew] = React.useState(false);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (onlyNew) root.setAttribute("data-only-new", "true");
    else root.removeAttribute("data-only-new");
  }, [onlyNew, rootRef]);

  React.useEffect(() => {
    const u = tinykeys(window, {
      ".": (e) => {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        setOnlyNew((v) => !v);
      },
    });
    return () => u();
  }, []);

  const jumpFirst = React.useCallback(() => {
    const first = document.querySelector<HTMLElement>("[data-new='true']");
    if (!first) return;
    for (const e of Array.from(
      document.querySelectorAll<HTMLElement>("[data-control-cursor='true']"),
    )) {
      e.removeAttribute("data-control-cursor");
    }
    first.setAttribute("data-control-cursor", "true");
    first.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  if (count <= 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <span className="font-medium text-primary">
        {count} new {count === 1 ? "comment" : "comments"} since your last visit
      </span>
      <button
        type="button"
        onClick={jumpFirst}
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-primary/10"
        title="Press n / Shift+N to navigate"
      >
        <ArrowDown className="size-3" />
        Jump to first
      </button>
      <button
        type="button"
        onClick={() => setOnlyNew((v) => !v)}
        aria-pressed={onlyNew}
        className={
          onlyNew
            ? "ml-auto rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground"
            : "ml-auto rounded border border-border px-2 py-0.5 text-xs hover:bg-accent"
        }
        title="Toggle (.) — show only branches with new comments"
      >
        {onlyNew ? "Showing only new" : "Show only new"}
      </button>
    </div>
  );
}

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}
