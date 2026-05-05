"use client";

import { Label } from "@/components/ui/label";
import {
  setAccent,
  setContentWidth,
  setFont,
  setFontSize,
  setJustify,
  setLineHeight,
  useAppearance,
} from "@/lib/appearance/store";
import { ACCENT_PRESETS, type AccentPresetId, type FontFamily } from "@/lib/appearance/types";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import * as React from "react";

const THEMES = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "black", label: "Black" },
] as const;

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

const FONTS: { id: FontFamily; label: string; sample: string }[] = [
  { id: "sans", label: "Sans", sample: "Aa" },
  { id: "serif", label: "Serif", sample: "Aa" },
  { id: "mono", label: "Mono", sample: "Aa" },
];

const FONT_SIZES = [13, 14, 16, 18];
const LINE_HEIGHTS: { value: number; label: string }[] = [
  { value: 1.4, label: "Tight" },
  { value: 1.55, label: "Default" },
  { value: 1.7, label: "Relaxed" },
  { value: 1.85, label: "Loose" },
];
const WIDTHS = [
  { id: "narrow", label: "Narrow" },
  { id: "default", label: "Default" },
  { id: "wide", label: "Wide" },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const a = useAppearance();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const currentAccentId = a.accent.kind === "preset" ? a.accent.id : null;
  const customColor = a.accent.kind === "custom" ? hslToHex(a.accent) : "#ff8800";

  return (
    <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-xs text-muted-foreground">Theme, accent color, and reading layout.</p>
      </div>

      <div className="grid gap-2">
        <Label>Theme</Label>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const active = mounted && theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Accent</Label>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENTS.map((acc) => {
            const c = ACCENT_PRESETS[acc.id];
            const active = currentAccentId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setAccent({ kind: "preset", id: acc.id })}
                aria-label={acc.label}
                title={acc.label}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-110",
                  active ? "border-foreground" : "border-transparent",
                )}
                style={{ background: `hsl(${c.h} ${c.s}% ${c.l}%)` }}
              />
            );
          })}
          <label className="ml-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
            Custom
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                const hsl = hexToHsl(e.target.value);
                if (hsl) setAccent({ kind: "custom", ...hsl });
              }}
              className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              aria-label="Custom accent color"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Font</Label>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFont(f.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border px-3 py-2",
                a.font === f.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
              )}
              style={{
                fontFamily:
                  f.id === "serif"
                    ? "var(--font-source-serif), ui-serif, Georgia, Cambria, serif"
                    : f.id === "mono"
                      ? "ui-monospace, monospace"
                      : "ui-sans-serif, system-ui, sans-serif",
              }}
            >
              <span className="text-lg">{f.sample}</span>
              <span className="text-[10px] text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Font size</Label>
        <div className="flex gap-2">
          {FONT_SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setFontSize(sz)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs",
                a.fontSize === sz
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {sz}px
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Line height</Label>
        <div className="flex flex-wrap gap-2">
          {LINE_HEIGHTS.map((lh) => (
            <button
              key={lh.value}
              type="button"
              onClick={() => setLineHeight(lh.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs",
                a.lineHeight === lh.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {lh.label} <span className="opacity-60">({lh.value})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Content width</Label>
        <div className="grid grid-cols-3 gap-2">
          {WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setContentWidth(w.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs",
                a.contentWidth === w.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Paragraph alignment</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["left", "justify"] as const).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJustify(j)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs capitalize",
                a.justify === j
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-dashed border-border p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
        <p className="mt-2 hn-text">
          The quick brown fox jumps over the lazy dog. Pellentesque habitant morbi tristique
          senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat
          vitae, ultricies eget, tempor sit amet, ante.
        </p>
      </div>
    </section>
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
