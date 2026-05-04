import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

class LRUAdapter implements Cache {
  // Keep up to 10k entries, evict by TTL or LRU.
  private readonly inner = new LRUCache<string, unknown>({
    max: 10_000,
    ttl: 60_000, // default 60s, overridden per-set
    ttlAutopurge: true,
  });

  async get<T>(key: string): Promise<T | null> {
    return (this.inner.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.inner.set(key, value as unknown, { ttl: ttlSeconds * 1000 });
  }
  async invalidate(key: string): Promise<void> {
    this.inner.delete(key);
  }
}

class UpstashAdapter implements Cache {
  constructor(private readonly client: Redis) {}
  async get<T>(key: string): Promise<T | null> {
    const v = await this.client.get<T>(key);
    return v ?? null;
  }
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value as unknown, { ex: ttlSeconds });
  }
  async invalidate(key: string): Promise<void> {
    await this.client.del(key);
  }
}

let _cache: Cache | null = null;

export function getCache(): Cache {
  if (_cache) return _cache;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    _cache = new UpstashAdapter(new Redis({ url, token }));
  } else {
    _cache = new LRUAdapter();
  }
  return _cache;
}

/** TTL constants in seconds, per the plan. */
export const TTL = {
  list: 60,
  item: 120,
  fanoutFallback: 30,
  user: 300,
  rss: 300,
  search: 60,
} as const;

/** Wrap a fetcher with cache-aside. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cache = getCache();
  const hit = await cache.get<T>(key);
  if (hit !== null) return hit;
  const fresh = await loader();
  await cache.set(key, fresh, ttlSeconds);
  return fresh;
}
