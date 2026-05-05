"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHistory } from "@/lib/history/store";
import { relativeTime } from "@/lib/time";
import { Clock, FileText, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function HistoryJump() {
  const { data } = useHistory();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const recent = React.useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.visitedAt - a.visitedAt).slice(0, 10);
  }, [data]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Recent history">
          <Clock className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-1">
        <DropdownMenuLabel className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Recent
        </DropdownMenuLabel>
        {!mounted || recent.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            Nothing yet. Visit a story or user; it'll show up here.
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {recent.map((h) => (
              <li key={h.id}>
                <Link
                  href={h.kind === "user" ? `/user/${h.refId}` : `/item/${h.refId}`}
                  className="flex items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {h.kind === "user" ? (
                    <User className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">
                      {h.title ?? (h.kind === "user" ? `user/${h.refId}` : `item/${h.refId}`)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {relativeTime(Math.floor(h.visitedAt / 1000))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <DropdownMenuSeparator />
        <Link
          href="/history"
          className="block rounded-sm px-2 py-1.5 text-center text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          View all history →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
