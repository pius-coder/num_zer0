import type { AuraConfig, AuraCookieMutation, AuraLogger, AuraRequestMetadata, AuraSessionData, AuraSource } from "./types";

export interface AuraCookieContext {
  set: AuraCookieMutation[];
}

export interface AuraResolvedSession {
  session: AuraSessionData | null;
  user: unknown | null;
}

export interface AuraAuthContext {
  setSessionCookie(token: string, expiresAt: Date): void;
  clearSessionCookie(): void;
  resolveSession?(request: Request): Promise<AuraResolvedSession>;
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
