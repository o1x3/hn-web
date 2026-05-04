/**
 * Per-session write rate limit: 1 write / 500 ms. In-memory map keyed by
 * username. Process-local; for multi-instance deploys move to Redis.
 *
 * Threat model: defeat compromised JS that tries to fan out votes faster than
 * a human would.
 */

const lastAt = new Map<string, number>();
const MIN_INTERVAL_MS = 500;

export function checkWriteRateLimit(key: string, now = Date.now()): {
  ok: true;
} | {
  ok: false;
  retryAfterMs: number;
} {
  const prev = lastAt.get(key);
  if (prev !== undefined && now - prev < MIN_INTERVAL_MS) {
    return { ok: false, retryAfterMs: MIN_INTERVAL_MS - (now - prev) };
  }
  lastAt.set(key, now);
  // Best-effort cleanup to avoid unbounded growth on long-lived processes.
  if (lastAt.size > 10_000) {
    const cutoff = now - 60_000;
    for (const [k, t] of lastAt) if (t < cutoff) lastAt.delete(k);
  }
  return { ok: true };
}
