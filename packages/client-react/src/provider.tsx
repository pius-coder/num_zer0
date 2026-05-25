"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { configureAura, type AuraClientConfig } from "./transport";

interface AuraProviderProps extends Partial<AuraClientConfig> {
  children: ReactNode;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
}

const AuraContext = createContext<{ baseUrl: string } | null>(null);

export function useAuraContext(): { baseUrl: string } {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error("useAuraContext must be used within AuraProvider");
  return ctx;
}

export function AuraProvider({
  children,
  baseUrl = "",
  queryClient,
  queryClientConfig,
}: AuraProviderProps) {
  const [qc] = React.useState(
    () => queryClient ?? new QueryClient(queryClientConfig),
  );

  React.useEffect(() => {
    configureAura({ baseUrl });
  }, [baseUrl]);

  return (
    <AuraContext.Provider value={{ baseUrl }}>
      <QueryClientProvider client={qc}>
        {children}
      </QueryClientProvider>
    </AuraContext.Provider>
  );
}
