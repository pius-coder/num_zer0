import type { z } from "zod";

export type NotificationHandler<TPayload, TCtx = unknown> = (args: {
  ctx: TCtx;
  payload: TPayload;
}) => Promise<void> | void;

export interface AuraNotificationDefinition<TPayload = unknown, TCtx = unknown> {
  readonly __auraNotification: true;
  readonly name: string;
  readonly payloadSchema: z.ZodType<TPayload>;
  readonly handler: NotificationHandler<TPayload, TCtx>;
}

export interface NotificationDispatcher {
  via(name: string): {
    send(payload: unknown): Promise<void>;
  };
}

export interface NotificationsPluginConfig {}

export interface OutboxEventRow {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

export interface NotificationsOutboxDb {
  auraOutboxEvent: {
    findMany(args: unknown): Promise<OutboxEventRow[]>;
    update(args: unknown): Promise<unknown>;
  };
}

export interface ProcessOutboxEventsContext {
  log: {
    info(message: string, metadata?: Record<string, unknown>): void;
  };
}

export interface ProcessOutboxEventsOptions<TCtx extends ProcessOutboxEventsContext = ProcessOutboxEventsContext> {
  db: NotificationsOutboxDb;
  createContext(args: { source: "internal"; requestId: string }): Promise<TCtx>;
  batchSize?: number;
}

export interface ProcessOutboxEventsResult {
  processed: number;
  succeeded: number;
  failed: number;
}
