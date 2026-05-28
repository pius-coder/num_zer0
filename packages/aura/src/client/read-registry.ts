"use client";

import { hashKey, type QueryKey } from "@tanstack/react-query";

const registry = new Map<string, Set<string>>();

function hash(qk: QueryKey): string {
  return hashKey(qk);
}

export function setReadKeys(queryKey: QueryKey, keys: string[]): void {
  registry.set(hash(queryKey), new Set(keys));
}

export function getReadKeys(queryKey: QueryKey): Set<string> | undefined {
  return registry.get(hash(queryKey));
}

export function deleteReadKeys(queryKey: QueryKey): void {
  registry.delete(hash(queryKey));
}

export function collectActiveReadKeys(
  queryCache: { getAll: () => Array<{ queryKey: QueryKey; isActive: () => boolean }> },
): Set<string> {
  const union = new Set<string>();
  for (const q of queryCache.getAll()) {
    if (!q.isActive()) continue;
    const keys = registry.get(hash(q.queryKey));
    if (keys) for (const k of keys) union.add(k);
  }
  return union;
}
