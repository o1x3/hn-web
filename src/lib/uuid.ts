/**
 * Tiny UUID v4 helper. Prefers `crypto.randomUUID` when available
 * (browsers + Node 19+), falls back to a Math.random shim sufficient
 * for client-only IDs (no security claims).
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC4122 v4-shaped fallback. Not cryptographically random; fine for keys.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
