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

export interface AuraSessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  sessionVersion: number;
}
