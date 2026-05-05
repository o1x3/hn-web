"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setAccent, useAppearance } from "@/lib/appearance/store";
import { ACCENT_PRESETS, type AccentPresetId } from "@/lib/appearance/types";
import { cn } from "@/lib/utils";
import { Check, Circle, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

const THEMES: {
  id: "system" | "light" | "dark" | "black";
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "system", label: "System", icon: <Monitor className="size-4" /> },
  { id: "light", label: "Light", icon: <Sun className="size-4" /> },
  { id: "dark", label: "Dark", icon: <Moon className="size-4" /> },
  { id: "black", label: "Black", icon: <Circle className="size-4 fill-current" /> },
];

const ACCENTS: { id: AccentPresetId; label: string }[] = [
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "amber", label: "Amber" },
  { id: "green", label: "Green" },
  { id: "teal", label: "Teal" },
  { id: "blue", label: "Blue" },
  { id: "violet", label: "Violet" },
  { id: "pink", label: "Pink" },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const appearance = useAppearance();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const currentAccentId = appearance.accent.kind === "preset" ? appearance.accent.id : null;
  const customColor = appearance.accent.kind === "custom" ? hslToHex(appearance.accent) : "#ff8800";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme & accent">
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2">
        <DropdownMenuLabel className="px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 pb-1">
          {THEMES.map((t) => {
            const active = mounted && theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={active}
                title={t.label}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md border text-[10px]",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Accent
        </DropdownMenuLabel>
        <div className="grid grid-cols-8 gap-1 pb-2">
          {ACCENTS.map((a) => {
            const c = ACCENT_PRESETS[a.id];
            const active = currentAccentId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent({ kind: "preset", id: a.id })}
                aria-label={a.label}
                aria-pressed={active}
                title={a.label}
                className={cn(
                  "relative size-6 rounded-full border-2 transition-transform hover:scale-110",
                  active ? "border-foreground" : "border-transparent",
                )}
                style={{ background: `hsl(${c.h} ${c.s}% ${c.l}%)` }}
              >
                {active ? (
                  <Check
                    className="absolute inset-0 m-auto size-3"
                    style={{ color: c.l < 60 ? "white" : "black" }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <label className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-xs text-muted-foreground">
          <span>Custom</span>
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              const hsl = hexToHsl(e.target.value);
              if (hsl) setAccent({ kind: "custom", ...hsl });
            }}
            className="h-6 w-10 cursor-pointer rounded border border-border bg-transparent"
            aria-label="Custom accent color"
          />
        </label>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const x = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
