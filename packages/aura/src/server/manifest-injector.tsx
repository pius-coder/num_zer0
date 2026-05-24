
import "@/aura.registry";

import type { ReactNode } from "react";
import { AuraProvider } from "@/aura/client";

import { getClientOperationManifest } from "./registry";

export function AuraProviderShell({
  children,
  config,
  queryClient,
  wsUrl,
}: {
  children: ReactNode;
  config?: Parameters<typeof AuraProvider>[0]["config"];
  queryClient?: Parameters<typeof AuraProvider>[0]["queryClient"];
  wsUrl?: string;
}) {
  const manifest = getClientOperationManifest();

  return (
    <AuraProvider config={config} queryClient={queryClient} wsUrl={wsUrl} initialManifest={manifest}>
      {children}
    </AuraProvider>
  );
}
