/**
 * Fetch wrapper with HN-friendly defaults: identifying User-Agent, exponential
 * backoff, 10 s timeout. The User-Agent is critical so dang can email rather
 * than block if the client misbehaves.
 */

const DEFAULT_USER_AGENT =
  process.env.HN_USER_AGENT ?? "hn-reddit/0.1 (+https://github.com/PLACEHOLDER/PLACEHOLDER)";

export interface FetchOptions extends RequestInit {
  /** Total attempts including the first; defaults to 3. */
  retries?: number;
  /** Base backoff in ms; doubles each attempt. Default 200. */
  backoffMs?: number;
  /** Per-request timeout in ms. Default 10_000. */
  timeoutMs?: number;
}

export async function hnFetch(url: string, opts: FetchOptions = {}): Promise<Response> {
  const {
    retries = 3,
    backoffMs = 200,
    timeoutMs = 10_000,
    headers,
    ...rest
  } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        signal: ctrl.signal,
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "application/json, text/html;q=0.9, */*;q=0.5",
          ...(headers as Record<string, string> | undefined),
        },
      });
      clearTimeout(timer);
      // Retry on 5xx and 429; succeed otherwise.
      if (res.status >= 500 || res.status === 429) {
        if (attempt < retries - 1) {
          await sleep(backoffMs * 2 ** attempt);
          continue;
        }
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries - 1) {
        await sleep(backoffMs * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastErr ?? new Error(`hnFetch failed: ${url}`);
}

/** JSON variant that throws on non-OK and parses. */
export async function hnFetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const res = await hnFetch(url, opts);
  if (!res.ok) {
    throw new Error(`hnFetchJson ${res.status} ${res.statusText} ${url}`);
  }
  return (await res.json()) as T;
}

/** Text variant for HTML scraping. */
export async function hnFetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const res = await hnFetch(url, opts);
  if (!res.ok) {
    throw new Error(`hnFetchText ${res.status} ${res.statusText} ${url}`);
  }
  return await res.text();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
