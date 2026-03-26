import type { ServiceIconCacheEntry } from "./types";

const MAX_ENTRIES = 100;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const cache = new Map<string, ServiceIconCacheEntry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > TTL_MS) {
      cache.delete(key);
    }
  }
}

function evictOldest(): void {
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = cache.keys().next().value;
  if (oldest) cache.delete(oldest);
}

export function getCachedIcon(
  key: string,
): ServiceIconCacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }

  // Move to end (most recently used)
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

export function setCachedIcon(
  key: string,
  entry: ServiceIconCacheEntry,
): void {
  evictExpired();
  evictOldest();

  // Delete and re-add to move to end
  cache.delete(key);
  cache.set(key, entry);
}

export function clearCache(): void {
  cache.clear();
}
