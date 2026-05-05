"use client";

import * as React from "react";
import {
  type Accent,
  type Appearance,
  DEFAULT_APPEARANCE,
  type FontFamily,
  STORAGE_KEY,
  contentWidthValue,
  fontFamilyValue,
  resolveAccent,
} from "./types";

function read(): Appearance {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Appearance;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(next: Appearance): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota or disabled storage; ignore
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const H = h / 360;
  const S = s / 100;
  const L = l / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((H * 6) % 2) - 1));
  const m = L - C / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  const i = Math.floor(H * 6) % 6;
  if (i === 0) [r, g, b] = [C, X, 0];
  else if (i === 1) [r, g, b] = [X, C, 0];
  else if (i === 2) [r, g, b] = [0, C, X];
  else if (i === 3) [r, g, b] = [0, X, C];
  else if (i === 4) [r, g, b] = [X, 0, C];
  else [r, g, b] = [C, 0, X];
  return [r + m, g + m, b + m];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Returns the HSL string for whichever of black/white has higher contrast against the given accent.
export function pickReadableForeground(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  const Y = relativeLuminance(r, g, b);
  const contrastWhite = 1.05 / (Y + 0.05);
  const contrastBlack = (Y + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? "0 0% 100%" : "0 0% 9%";
}

export function applyAppearance(a: Appearance): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const merged = { ...DEFAULT_APPEARANCE, ...a };

  const { h, s, l } = resolveAccent(merged.accent);
  html.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  html.style.setProperty("--ring", `${h} ${s}% ${l}%`);
  html.style.setProperty("--color-upvote-h", String(h));
  html.style.setProperty("--color-upvote-s", `${s}%`);
  html.style.setProperty("--color-upvote-l", `${l}%`);
  html.style.setProperty("--primary-foreground", pickReadableForeground(h, s, l));

  html.style.setProperty("--reader-font-family", fontFamilyValue(merged.font));
  html.style.setProperty("--reader-font-size", `${merged.fontSize}px`);
  html.style.setProperty("--reader-line-height", String(merged.lineHeight));
  html.style.setProperty("--reader-content-width", contentWidthValue(merged.contentWidth));
  html.style.setProperty("--reader-justify", merged.justify);
  html.dataset.readerFont = merged.font;
}

const listeners = new Set<() => void>();
function notify() {
  for (const fn of listeners) fn();
}

export function setAppearance(patch: Appearance): void {
  const prev = read();
  const next = { ...prev, ...patch };
  write(next);
  applyAppearance(next);
  notify();
}

export function setAccent(accent: Accent): void {
  setAppearance({ accent });
}

export function setFont(font: FontFamily): void {
  setAppearance({ font });
}

export function setFontSize(fontSize: number): void {
  setAppearance({ fontSize });
}

export function setLineHeight(lineHeight: number): void {
  setAppearance({ lineHeight });
}

export function setContentWidth(contentWidth: "narrow" | "default" | "wide"): void {
  setAppearance({ contentWidth });
}

export function setJustify(justify: "left" | "justify"): void {
  setAppearance({ justify });
}

export function useAppearance(): Required<Appearance> {
  const [mounted, setMounted] = React.useState(false);
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    setMounted(true);
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        applyAppearance(read());
        fn();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  // Always return defaults during SSR + first client render to avoid
  // hydration mismatch — actual values applied via the inline script.
  if (!mounted) return { ...DEFAULT_APPEARANCE };
  return { ...DEFAULT_APPEARANCE, ...read() };
}
