"use client";

import { HnFlavoredText } from "@/components/hn-flavored-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as React from "react";

const FORMAT_HINT = "*italic* · indent 2 spaces for code · URLs auto-link";

/**
 * Textarea with an Edit/Preview toggle. Preview renders with the same parser HN uses.
 * ⌘/Ctrl+Enter submits.
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
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  const submitDisabled = disabled || busy || !text.trim();

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (submitDisabled) return;
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const switchMode = (m: "edit" | "preview") => {
    setMode(m);
    if (m === "edit") queueMicrotask(() => taRef.current?.focus());
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="inline-flex gap-3" role="tablist" aria-label="Editor mode">
          {(["edit", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "capitalize pb-0.5 border-b transition-colors",
                mode === m
                  ? "border-foreground text-foreground"
                  : "border-transparent hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="hidden sm:inline truncate">{FORMAT_HINT}</span>
      </div>

      <Textarea
        ref={taRef}
        name={name}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(mode === "preview" && "hidden")}
        aria-hidden={mode === "preview"}
      />
      {mode === "preview" ? (
        <div
          role="tabpanel"
          className="rounded-md border border-border bg-muted/20 p-3 min-h-[8rem] text-sm"
        >
          {text.trim() ? (
            <HnFlavoredText text={text} />
          ) : (
            <div className="text-xs text-muted-foreground/70 leading-relaxed">
              <div className="text-foreground/80">Live preview</div>
              <em>italics</em>, code blocks, and links render as you type.
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {text.length > 0 ? (
            <>
              {text.length} chars
              <span className="hidden lg:inline opacity-60 ml-2">⌘↵ to send</span>
            </>
          ) : (
            <span className="hidden lg:inline opacity-60">⌘↵ to send</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={submitDisabled}
            aria-keyshortcuts="Meta+Enter Control+Enter"
          >
            {busy ? "Posting…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
