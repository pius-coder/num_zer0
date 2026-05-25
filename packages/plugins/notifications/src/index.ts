import type { AuraPlugin } from "@aura/core";
import { createNotificationDispatcher } from "./dispatcher";
import type { NotificationDispatcher, NotificationsPluginConfig } from "./types";

declare module "@aura/core" {
  interface AuraContextExtensions {
    notify?: NotificationDispatcher;
  }
}

export function createNotificationsPlugin(_config: NotificationsPluginConfig = {}): AuraPlugin {
  return {
    name: "@aura/notifications",
    version: "0.0.0",
    setup(ctx) {
      ctx.context.extend((baseCtx) => ({
        notify: createNotificationDispatcher(() => baseCtx),
      }));
    },
  };
}

export { createNotificationDispatcher } from "./dispatcher";
export { defineNotificationFn, hasNotification } from "./registry";
export { processOutboxEvents } from "./outbox";
export type {
  AuraNotificationDefinition, NotificationDispatcher, NotificationHandler,
  NotificationsOutboxDb, NotificationsPluginConfig, OutboxEventRow,
  ProcessOutboxEventsOptions, ProcessOutboxEventsResult,
} from "./types";
