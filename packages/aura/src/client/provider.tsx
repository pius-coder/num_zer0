"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AuraRealtimeProvider } from "@aura/realtime/client";
import { configureAura, type AuraClientConfig } from "./transport";
import type { AuraClientManifest } from "@/aura/shared/manifest";
import {
  setManifestEntities,
  getOperationEntities,
} from "./manifest-cache";

function manifestToEntityMap(
  manifest: AuraClientManifest,
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const op of manifest.operations) {
    map[op.name] = [...op.entities];
  }
  return map;
}

/**
 * Bridges realtime invalidations into the React Query cache.
 *
 * A query is invalidated when any of its observed entities — declared on
 * the operation manifest or attached via `query.meta.entities` — appears
 * in the broadcast key set.
 */
const envWsUrl = (() => {
  const baked = import.meta.env.VITE_AURA_WS_URL as string | undefined;
  if (baked) return baked;
  if (import.meta.env.DEV) return undefined;
  console.error(
    "[aura] VITE_AURA_WS_URL is not set — realtime disabled in production build. " +
    "Pass it via --build-arg VITE_AURA_WS_URL=wss://api.example.com/ws."
  );
  return undefined;
})();

function AuraQueryInvalidator({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  function onInvalidate(keys: string[]) {
    const matched: string[] = [];
    queryClient.invalidateQueries({
      predicate: (query) => {
        const name = query.queryKey[1] as string;
        const metaEntities = (query.meta?.entities as string[]) ?? [];
        const manifestEntities = getOperationEntities(name);
        const observed = new Set([...metaEntities, ...manifestEntities]);
        const hit = keys.some((k) => k === name || observed.has(k));
        if (hit) matched.push(name);
        return hit;
      },
    });
    if (matched.length > 0) {
      console.log("[aura:realtime] invalidated", matched, "from", keys);
    }
  }

  return (
    <AuraRealtimeProvider wsUrl={envWsUrl} onInvalidate={onInvalidate}>
      {children}
    </AuraRealtimeProvider>
  );
}

export interface AuraClientProviderProps {
  children: ReactNode;
  config?: Partial<AuraClientConfig>;
  queryClient?: QueryClient;
  /**
   * Operation manifest serialized on the server. When provided, the client
   * seeds its entity cache synchronously before the first render — removing
   * the race that made cross-operation invalidation silently incomplete on
   * initial mount.
   */
  initialManifest?: AuraClientManifest;
}

export function AuraClientProvider({
  children,
  config,
  queryClient,
  initialManifest,
}: AuraClientProviderProps) {
  if (config) configureAura(config);

  if (initialManifest) {
    setManifestEntities(manifestToEntityMap(initialManifest));
  }

  const [ownedQueryClient] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTime: 0 so invalidated queries refetch immediately rather
            // than waiting for the next focus event.
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

  return (
    <QueryClientProvider client={ownedQueryClient}>
      <NuqsAdapter>
        <AuraQueryInvalidator>{children}</AuraQueryInvalidator>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}

export const AuraProvider = AuraClientProvider;
export type AuraProviderProps = AuraClientProviderProps;
