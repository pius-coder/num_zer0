import "@/aura.registry";

import type { ReactNode } from "react";
import { AuraProvider } from "@/aura/client";

import { getClientOperationManifest } from "./registry";

/**
 * Server-side wrapper that seeds the client manifest synchronously so the
 * entity cache is ready before the first render.
 */
export function AuraProviderShell({
  children,
  config,
  queryClient,
}: {
  children: ReactNode;
  config?: Parameters<typeof AuraProvider>[0]["config"];
  queryClient?: Parameters<typeof AuraProvider>[0]["queryClient"];
}) {
  return (
    <AuraProvider config={config} queryClient={queryClient} initialManifest={getClientOperationManifest()}>
      {children}
    </AuraProvider>
  );
}
