import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60,
});

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) {
    return cached;
  }

  const value = await fn();
  cache.set(key, value, { ttl: ttlMs });
  return value;
}
