import { cached, getCache } from "@/lib/cache";
import { describe, expect, it, vi } from "vitest";

describe("LRU cache adapter", () => {
  it("stores and retrieves values", async () => {
    const c = getCache();
    await c.set("a", { hello: "world" }, 60);
    expect(await c.get("a")).toEqual({ hello: "world" });
  });

  it("invalidate removes a key", async () => {
    const c = getCache();
    await c.set("b", 1, 60);
    await c.invalidate("b");
    expect(await c.get("b")).toBeNull();
  });

  it("expires after TTL (real timer, ~1.1s)", async () => {
    // lru-cache uses perf.now() under the hood and doesn't honor vi.useFakeTimers.
    // Use a short real wait for one assertion.
    const c = getCache();
    await c.set("c", "v", 1);
    expect(await c.get("c")).toBe("v");
    await new Promise((r) => setTimeout(r, 1200));
    expect(await c.get("c")).toBeNull();
  }, 5_000);
});

describe("cached() helper", () => {
  it("calls loader once on cache miss, returns same on hit", async () => {
    const loader = vi.fn().mockResolvedValue({ n: 1 });
    const k = `cached-test-${Math.random()}-${Date.now()}`;
    const a = await cached(k, 60, loader);
    const b = await cached(k, 60, loader);
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
