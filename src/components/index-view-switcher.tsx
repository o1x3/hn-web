"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_COLUMNS, useIndexColumns, useIndexViewMode } from "@/lib/index-view/store";
import { cn } from "@/lib/utils";
import { Columns3, LayoutGrid, List as ListIcon } from "lucide-react";

export function IndexViewSwitcher() {
  const [viewMode, setViewMode] = useIndexViewMode();
  const [columns, , toggleColumn] = useIndexColumns();

  return (
    <div className="flex items-center justify-end gap-1">
      <div className="inline-flex rounded-md border border-border p-0.5">
        <button
          type="button"
          onClick={() => setViewMode("list")}
          aria-pressed={viewMode === "list"}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs",
            viewMode === "list"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="List view"
        >
          <LayoutGrid className="size-3.5" />
          List
        </button>
        <button
          type="button"
          onClick={() => setViewMode("table")}
          aria-pressed={viewMode === "table"}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs",
            viewMode === "table"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="Table view"
        >
          <ListIcon className="size-3.5" />
          Table
        </button>
      </div>
      {viewMode === "table" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Columns3 className="size-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1">
            <DropdownMenuLabel className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Columns
            </DropdownMenuLabel>
            <ul className="grid">
              {ALL_COLUMNS.map((c) => {
                const active = columns.includes(c.id);
                const locked = "locked" in c && c.locked;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => toggleColumn(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-accent",
                        locked && "opacity-70 cursor-not-allowed",
                      )}
                    >
                      <span>{c.label}</span>
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className="pointer-events-none accent-primary"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
