"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { clearHistory, deleteVisit, useHistory } from "@/lib/history/store";
import type { HistoryKind } from "@/lib/idb/schema";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const KINDS: { id: "all" | HistoryKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "story", label: "Stories" },
  { id: "user", label: "Users" },
];

export function HistoryView() {
  const [kind, setKind] = React.useState<"all" | HistoryKind>("all");
  const [q, setQ] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const { data, isLoading } = useHistory();
  const toast = useToast();

  const list = React.useMemo(() => {
    let l = (data ?? []).slice();
    if (kind !== "all") l = l.filter((h) => h.kind === kind);
    const ql = q.trim().toLowerCase();
    if (ql)
      l = l.filter(
        (h) => (h.title ?? "").toLowerCase().includes(ql) || h.refId.toLowerCase().includes(ql),
      );
    l.sort((a, b) => b.visitedAt - a.visitedAt);
    return l;
  }, [data, kind, q]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              kind === k.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="ml-auto rounded-md border border-border bg-card px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex justify-end">
        {confirming ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Are you sure? This wipes all history.</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await clearHistory();
                setConfirming(false);
                toast.push("History cleared", "default");
              }}
            >
              Yes, clear
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Clear all
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : list.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing yet. Visit a story or user; it'll show up here.
        </div>
      ) : (
        <ul className="grid gap-1">
          {list.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={h.kind === "user" ? `/user/${h.refId}` : `/item/${h.refId}`}
                  className="font-medium hover:underline truncate block"
                >
                  {h.title ?? (h.kind === "user" ? `user/${h.refId}` : `item/${h.refId}`)}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {h.kind} · {relativeTime(Math.floor(h.visitedAt / 1000))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove from history"
                onClick={() => deleteVisit(h.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
