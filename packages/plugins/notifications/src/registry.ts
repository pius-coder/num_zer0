import { z } from "zod";
import type { AuraNotificationDefinition, NotificationHandler } from "./types";

const notificationRegistry = new Map<string, AuraNotificationDefinition<unknown, unknown>>();

interface NotificationBuilder<TPayload = unknown, TCtx = unknown> {
  payload<TSchema extends z.ZodType>(schema: TSchema): NotificationBuilder<z.infer<TSchema>, TCtx>;
  handler(fn: NotificationHandler<TPayload, TCtx>): AuraNotificationDefinition<TPayload, TCtx>;
}

function makeNotificationBuilder<TPayload = unknown, TCtx = unknown>(
  name: string,
  existingState?: { name: string; payloadSchema: z.ZodType | null },
): NotificationBuilder<TPayload, TCtx> {
  const state = existingState ?? { name, payloadSchema: null as z.ZodType | null };

  return {
    payload<TSchema extends z.ZodType>(schema: TSchema) {
      state.payloadSchema = schema;
      return makeNotificationBuilder<z.infer<TSchema>, TCtx>(name, state);
    },
    handler(fn) {
      if (!state.payloadSchema) {
        throw new Error(`[aura] Notification "${name}" is missing .payload(schema).`);
      }

      const definition: AuraNotificationDefinition<TPayload, TCtx> = {
        __auraNotification: true,
        name: state.name,
        payloadSchema: state.payloadSchema as z.ZodType<TPayload>,
        handler: fn,
      };

      notificationRegistry.set(state.name, definition as unknown as AuraNotificationDefinition<unknown, unknown>);
      return definition;
    },
  };
}

export function defineNotificationFn<TCtx = unknown>(name: string): NotificationBuilder<unknown, TCtx> {
  return makeNotificationBuilder<unknown, TCtx>(name);
}

export function getNotification(name: string): AuraNotificationDefinition<unknown, unknown> | null {
  return notificationRegistry.get(name) ?? null;
}

export function hasNotification(name: string): boolean {
  return notificationRegistry.has(name);
}
