export type ThemeName = "light" | "dark" | "black";

export type AccentPresetId =
  | "orange"
  | "red"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink";

export type Accent =
  | { kind: "preset"; id: AccentPresetId }
  | { kind: "custom"; h: number; s: number; l: number };

export type FontFamily = "sans" | "serif" | "mono";

export interface Appearance {
  accent?: Accent;
  font?: FontFamily;
  fontSize?: number;
  lineHeight?: number;
  contentWidth?: "narrow" | "default" | "wide";
  justify?: "left" | "justify";
}

export const ACCENT_PRESETS: Record<AccentPresetId, { h: number; s: number; l: number }> = {
  orange: { h: 20, s: 90, l: 55 },
  red: { h: 0, s: 75, l: 55 },
  amber: { h: 40, s: 92, l: 55 },
  green: { h: 145, s: 60, l: 42 },
  teal: { h: 175, s: 70, l: 40 },
  blue: { h: 215, s: 80, l: 55 },
  violet: { h: 265, s: 70, l: 60 },
  pink: { h: 330, s: 80, l: 60 },
};

export const DEFAULT_APPEARANCE: Required<Appearance> = {
  accent: { kind: "preset", id: "orange" },
  font: "sans",
  fontSize: 14,
  lineHeight: 1.55,
  contentWidth: "default",
  justify: "left",
};

export const STORAGE_KEY = "hn-appearance";

export function resolveAccent(a: Accent): { h: number; s: number; l: number } {
  if (a.kind === "preset") return ACCENT_PRESETS[a.id];
  return { h: a.h, s: a.s, l: a.l };
}

export function fontFamilyValue(f: FontFamily): string {
  if (f === "serif") return 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
  if (f === "mono") return "var(--font-mono)";
  return "var(--font-sans)";
}

export function contentWidthValue(w: "narrow" | "default" | "wide"): string {
  if (w === "narrow") return "60rem";
  if (w === "wide") return "96rem";
  return "80rem";
}
