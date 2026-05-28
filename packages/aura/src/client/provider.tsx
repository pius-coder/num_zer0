"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AuraRealtimeProvider, type RealtimeHandle } from "@aura/realtime/client";
import { configureAura, type AuraClientConfig } from "./transport";
import { getReadKeys, collectActiveReadKeys } from "./read-registry";

const envWsUrl = (() => {
  const baked = import.meta.env.VITE_AURA_WS_URL as string | undefined;
  if (baked) return baked;
  console.error(
    "[aura] VITE_AURA_WS_URL is not set — realtime disabled. " +
    "Set it in .env.local (dev) or via --build-arg VITE_AURA_WS_URL=wss://api.example.com/ws (prod)."
  );
  return undefined;
})();

function AuraQueryInvalidator({
  children,
  realtimeRef,
}: {
  children: ReactNode;
  realtimeRef: React.RefObject<RealtimeHandle | null>;
}) {
  const queryClient = useQueryClient();

  function onInvalidate(keys: string[]) {
    const matched: string[] = [];
    console.log("[aura:debug] realtime.onInvalidate called with keys:", keys);
    queryClient.invalidateQueries({
      predicate: (query) => {
        const reads = getReadKeys(query.queryKey);
        if (!reads) {
          const fallback = keys.includes(query.queryKey[1] as string);
          console.log("[aura:debug] realtime predicate fallback", query.queryKey[1], "keys:", keys, "=>", fallback);
          return fallback;
        }
        const hit = keys.some((k) => reads.has(k));
        if (hit) matched.push(query.queryKey[1] as string);
        console.log("[aura:debug] realtime predicate match", query.queryKey[1], "keys:", keys, "reads:", [...reads], "=>", hit);
        return hit;
      },
    });
    if (matched.length > 0) {
      console.log("[aura:realtime] invalidated", matched, "from", keys);
    }
  }

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const union = collectActiveReadKeys(queryClient.getQueryCache());
      realtimeRef.current?.setSubscriptions(union);
    });
    return unsubscribe;
  }, [queryClient, realtimeRef]);

  return (
    <AuraRealtimeProvider
      ref={realtimeRef}
      wsUrl={envWsUrl}
      onInvalidate={onInvalidate}
    >
      {children}
    </AuraRealtimeProvider>
  );
}

export interface AuraClientProviderProps {
  children: ReactNode;
  config?: Partial<AuraClientConfig>;
  queryClient?: QueryClient;
}

export function AuraClientProvider({
  children,
  config,
  queryClient,
}: AuraClientProviderProps) {
  if (config) configureAura(config);

  const [ownedQueryClient] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: { retry: false },
        },
      }),
  );

  const realtimeRef = useRef<RealtimeHandle | null>(null);

  return (
    <QueryClientProvider client={ownedQueryClient}>
      <NuqsAdapter>
        <AuraQueryInvalidator realtimeRef={realtimeRef}>
          {children}
        </AuraQueryInvalidator>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}

export const AuraProvider = AuraClientProvider;
export type AuraProviderProps = AuraClientProviderProps;
