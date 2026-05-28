/**
 * `useAuraPaginatedQuery` — cursor-based infinite scroll hook.
 * Resolves: Requirement 25.5 (Task 16.2).
 * Built on TanStack Query's `useInfiniteQuery`.
 */

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { OperationRef } from "@/aura/core/types";
import { auraQueryKey } from "@/aura/shared/query-key";
import { callAuraOperationWithMeta } from "./transport";
import { setReadKeys, getReadKeys } from "./read-registry";

export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
  isDone: boolean;
}

export interface UseAuraPaginatedQueryOptions {
  numItems?: number;
  enabled?: boolean;
}

export function useAuraPaginatedQuery<TInput extends Record<string, unknown>, TOutput>(
  ref: OperationRef<"query", TInput, PaginatedResult<TOutput>> | string,
  input: Omit<TInput, "cursor" | "numItems">,
  options: UseAuraPaginatedQueryOptions = {},
) {
  const name = typeof ref === "string" ? ref : ref._name;
  const numItems = options.numItems ?? 20;

  const queryKey = auraQueryKey(name, { ...input, numItems }) as readonly unknown[];

  const query = useInfiniteQuery<PaginatedResult<TOutput>>({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const fullInput = { ...input, cursor: pageParam, numItems };
      const result = await callAuraOperationWithMeta<PaginatedResult<TOutput>>({
        operationName: name,
        input: fullInput,
        signal,
      });
      const isFirstPage = pageParam === null;
      const base = isFirstPage ? new Set<string>() : new Set<string>(getReadKeys(queryKey) ?? []);
      for (const k of result.meta.readKeys) base.add(k);
      setReadKeys(queryKey, [...base]);
      if (typeof window !== "undefined") {
        console.log("[aura:debug] usePaginatedQuery", name, "readKeys:", [...base]);
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    enabled: options.enabled,
  });

  const allItems = query.data?.pages.flatMap((p) => p.items) ?? [];
  const isDone = query.data?.pages[query.data.pages.length - 1]?.isDone ?? false;

  return {
    items: allItems,
    isDone,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
    error: query.error,
    refetch: query.refetch,
  };
}
export const usePaginatedQuery = useAuraPaginatedQuery;
