"use client";

import { HnFlavoredText } from "@/components/hn-flavored-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Textarea + side-by-side live preview rendered with the same parser HN
 * uses. Clicking "Hide preview" collapses the right pane.
 *
 * FRAGILE: parity with HN's render is approximate; see lib/hn/hn-text.ts.
 */
export function CommentEditor({
  name = "text",
  defaultValue = "",
  placeholder = "Add to the conversation…",
  rows = 6,
  disabled,
  busy,
  submitLabel = "Reply",
  onCancel,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  busy?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [text, setText] = React.useState(defaultValue);
  const [showPreview, setShowPreview] = React.useState(true);

  return (
    <div className="grid gap-2">
      <div className={cn("grid gap-3", showPreview && "lg:grid-cols-2")}>
        <Textarea
          name={name}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
        />
        {showPreview ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 min-h-[6rem] text-sm">
            {text.trim() ? (
              <HnFlavoredText text={text} />
            ) : (
              <span className="text-muted-foreground">Preview…</span>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <details className="cursor-pointer">
          <summary>Formatting</summary>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            <li>Blank line = new paragraph</li>
            <li>
              Wrap with <code className="font-mono">*</code> for italics:{" "}
              <code className="font-mono">*hello*</code>
            </li>
            <li>Indent two spaces for code blocks</li>
            <li>URLs auto-link</li>
          </ul>
        </details>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="hover:underline"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={disabled || busy || !text.trim()}>
            {busy ? "Posting…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
