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
  // Pick black/white text on the accent for AA contrast.
  html.style.setProperty("--primary-foreground", l < 60 ? "0 0% 100%" : "0 0% 9%");

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
