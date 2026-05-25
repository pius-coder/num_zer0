import { AuraError } from "@aura/core";
import { getNotification } from "./registry";
import type { NotificationDispatcher } from "./types";

export function createNotificationDispatcher<TCtx>(ctxFactory: () => TCtx): NotificationDispatcher {
  return {
    via(name) {
      return {
        async send(payload) {
          const definition = getNotification(name);
          if (!definition) {
            throw new AuraError("INTERNAL_ERROR", `Notification Aura non definie: ${name}`, {
              expose: process.env.NODE_ENV !== "production",
            });
          }

          const parsed = definition.payloadSchema.safeParse(payload);
          if (!parsed.success) {
            throw new AuraError("VALIDATION_ERROR", `Payload de notification invalide: ${name}`);
          }

          await definition.handler({ ctx: ctxFactory(), payload: parsed.data });
        },
      };
    },
  };
}
