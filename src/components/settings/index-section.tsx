"use client";

import { Label } from "@/components/ui/label";
import { ALL_COLUMNS, useIndexColumns, useIndexViewMode } from "@/lib/index-view/store";
import { cn } from "@/lib/utils";

export function IndexSection() {
  const [viewMode, setViewMode] = useIndexViewMode();
  const [columns, , toggleColumn] = useIndexColumns();

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Index</h2>
        <p className="text-xs text-muted-foreground">
          How story lists render and which columns to show in table view.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Default view</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["list", "table"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs capitalize",
                viewMode === m
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Table columns</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_COLUMNS.map((c) => {
            const active = columns.includes(c.id);
            const locked = "locked" in c && c.locked;
            return (
              <button
                key={c.id}
                type="button"
                disabled={locked}
                onClick={() => toggleColumn(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                  locked && "opacity-70 cursor-not-allowed",
                )}
              >
                {c.label}
                {locked ? " (locked)" : ""}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Columns only apply when the table view is active.
        </p>
      </div>
    </section>
  );
}
