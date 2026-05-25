import type { AuraAuthContext, AuraConfig, AuraCookieMutation, AuraLogger, AuraRequestMetadata, AuraResolvedSession, AuraSessionData, AuraSource } from "./types";

export interface AuraCookieContext {
  set: AuraCookieMutation[];
}

export interface AuraContextExtensions {}

export interface AuraContextBase {
  requestId: string;
  source: AuraSource;
  log: AuraLogger;
  request: AuraRequestMetadata;
  rawRequest?: Request;
  config: AuraConfig;
  cookies: AuraCookieContext;
  auth?: AuraAuthContext;
  session: AuraSessionData | null;
  user: unknown | null;
}

export interface AuraContext extends AuraContextBase, AuraContextExtensions {}

export type AuraContextPatch = Partial<AuraContext> & Record<string, unknown>;
export type ContextExtension = (ctx: AuraContext) => AuraContextPatch | Promise<AuraContextPatch>;
