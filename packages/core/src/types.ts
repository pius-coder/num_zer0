export type AuraSource = "bridge" | "rsc" | "cron" | "internal" | "scheduler" | "test";

export type OperationType = "query" | "mutate" | "action";
export type OperationAccess = "auth" | "public" | "internal";
export type EntityTag = string;

export interface AuraLogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

export interface AuraConfig {
  plugins: Array<{ name: string; config?: unknown }>;
  [key: string]: unknown;
}

export interface AuraRequestMetadata {
  ip?: string;
  userAgent?: string;
  origin?: string;
  countryCode?: string;
}

export interface AuraCookieMutation {
  name: string;
  value: string;
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
    expires?: Date;
  };
}

export interface OperationRef<
  TType extends OperationType = OperationType,
  TInput = unknown,
  TOutput = unknown,
> {
  readonly _name: string;
  readonly _type: TType;
  readonly _input?: TInput;
  readonly _output?: TOutput;
}

export type InferOperationInput<T> = T extends { _input?: infer TInput }
  ? TInput
  : never;

export type InferOperationOutput<T> = T extends { _output?: infer TOutput }
  ? TOutput
  : never;

export interface AuraAuthContext {
  setSessionCookie(token: string, expiresAt: Date): void;
  clearSessionCookie(): void;
  resolveSession?(request: Request): Promise<AuraResolvedSession>;
}

export interface AuraResolvedSession {
  session: AuraSessionData | null;
  user: unknown | null;
}

export interface AuraSessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  sessionVersion: number;
}

import type { AuraBump, AuraBumpVariant } from "./envelope";

export interface AuraBumpStore {
  add(variant: AuraBumpVariant, title: string, description?: string): void;
  success(title: string, description?: string): void;
  info(title: string, description?: string): void;
  warning(title: string, description?: string): void;
  error(title: string, description?: string): void;
  all(): AuraBump[];
}

export interface AuraAuditContext {
  record(action: string, metadata?: Record<string, unknown>): Promise<void>;
}

export type PrismaReadOnlyClient = {
  [key: string]: unknown;
  $transaction: unknown;
};

export interface AuraScheduler {
  runAfter<TInput>(
    delayMs: number,
    ref: OperationRef<OperationType, TInput, unknown>,
    input: TInput,
  ): Promise<string>;
  runAt<TInput>(
    timestamp: Date,
    ref: OperationRef<OperationType, TInput, unknown>,
    input: TInput,
  ): Promise<string>;
  cancel(scheduledId: string): Promise<void>;
}

export interface AgentRef {
  readonly _name: string;
  readonly __auraAgent: true;
}

export interface AgentThreadRef {
  readonly _id: string;
  readonly _agentName: string;
}

export interface AuraAgent {
  createThread(
    ref: AgentRef,
    opts?: { userId?: string; title?: string; metadata?: Record<string, unknown> },
  ): Promise<AgentThreadRef>;
  generateText(
    thread: AgentThreadRef,
    opts: { prompt: string; maxSteps?: number },
  ): Promise<{ content: string; messageId: string }>;
  streamText(
    thread: AgentThreadRef,
    opts: { prompt: string; maxSteps?: number; onDelta?: (delta: string) => void },
  ): Promise<{ content: string; messageId: string }>;
  getUsage(opts?: {
    userId?: string;
    agentName?: string;
    since?: Date;
  }): Promise<{
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
}

export interface BaseAuraContext {
  session: AuraSessionData | null;
  user: unknown;
  auth: AuraAuthContext;
  notify: { send: (channel: string, data: unknown) => Promise<void> };
  bump: AuraBumpStore;
  log: AuraLogger;
  audit: AuraAuditContext;
  requestId: string;
  source: AuraSource;
  request: AuraRequestMetadata;
  cookies: {
    set: AuraCookieMutation[];
  };
}

export interface AuraQueryContext extends BaseAuraContext {
  db: PrismaReadOnlyClient;
  runQuery<TRef extends OperationRef<"query">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
}

export interface AuraMutationContext extends BaseAuraContext {
  db: Record<string, unknown> & { $transaction: unknown };
  runQuery<TRef extends OperationRef<"query">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
  runMutation<TRef extends OperationRef<"mutate">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
  scheduler: AuraScheduler;
  invalidate(target: { entity: string; id?: string }): void;
}

export interface AuraActionContext extends BaseAuraContext {
  runQuery<TRef extends OperationRef<"query">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
  runMutation<TRef extends OperationRef<"mutate">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
  runAction<TRef extends OperationRef<"action">>(
    ref: TRef,
    input: InferOperationInput<TRef>,
  ): Promise<InferOperationOutput<TRef>>;
  scheduler: AuraScheduler;
  storage: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<void>; delete: (key: string) => Promise<void> };
  fetch: typeof globalThis.fetch;
}
