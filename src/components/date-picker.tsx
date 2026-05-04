"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/** YYYY-MM-DD for any Date in UTC. */
function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

const HN_BIRTHDAY = new Date(Date.UTC(2007, 1, 19)); // 2007-02-19

/**
 * Hand-rolled calendar popover. Self-contained: ~120 lines, no extra deps.
 * Returns the picked YYYY-MM-DD via the global navigator (router.push).
 */
export function DatePickerButton({ initialDate }: { initialDate?: string }) {
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  const seed = initialDate ? new Date(`${initialDate}T00:00:00Z`) : today;
  const [view, setView] = React.useState<Date>(startOfMonth(seed));
  const [selected, setSelected] = React.useState<string>(initialDate ?? fmt(today));
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const monthLabel = view.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const days = daysInMonth(view);
  const firstDow = view.getUTCDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const navTo = (date: string) => {
    setSelected(date);
    setOpen(false);
    router.push(`/front/${date}`);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays className="size-4" />
        <span className="ml-1 hidden md:inline">Front page on…</span>
      </Button>
      {open ? (
        <div
          aria-label="Pick a date"
          className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-border bg-popover p-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView((v) => addMonths(v, -1))}
              className="rounded p-1 hover:bg-accent"
              disabled={addMonths(view, -1) < startOfMonth(HN_BIRTHDAY)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-sm font-medium">{monthLabel}</div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="rounded p-1 hover:bg-accent"
              disabled={addMonths(view, 1) > startOfMonth(today)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} />;
              const dt = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth(), d));
              const dStr = fmt(dt);
              const future = dt > today;
              const tooEarly = dt < HN_BIRTHDAY;
              const isSelected = dStr === selected;
              return (
                <button
                  type="button"
                  key={i}
                  disabled={future || tooEarly}
                  onClick={() => navTo(dStr)}
                  className={cn(
                    "rounded p-1 text-xs hover:bg-accent",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    (future || tooEarly) && "opacity-30",
                  )}
                  title={dStr}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <button
              type="button"
              onClick={() => navTo(fmt(today))}
              className="text-muted-foreground hover:text-foreground"
            >
              Today
            </button>
            <span className="text-muted-foreground">{selected}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
