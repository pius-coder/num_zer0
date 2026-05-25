import type { AuraConfig, AuraLogger, AuraRequestMetadata, AuraSource } from "./types";

export interface AuraContext {
  requestId: string;
  source: AuraSource;
  log: AuraLogger;
  request: AuraRequestMetadata;
  config: AuraConfig;
  capabilities: Record<string, unknown>;
}

export type ContextExtension<T> = (ctx: AuraContext) => T;
