import { createNotificationDispatcher } from "./dispatcher";
import type { ProcessOutboxEventsContext, ProcessOutboxEventsOptions, ProcessOutboxEventsResult } from "./types";

const OUTBOX_LOCK_SECONDS = 60;
const OUTBOX_BATCH_SIZE = 100;

export async function processOutboxEvents<TCtx extends ProcessOutboxEventsContext>(
  options: ProcessOutboxEventsOptions<TCtx>,
): Promise<ProcessOutboxEventsResult> {
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() - OUTBOX_LOCK_SECONDS * 1000);

  const events = await options.db.auraOutboxEvent.findMany({
    where: {
      status: "PENDING",
      nextRunAt: { lte: now },
      OR: [{ lockedAt: null }, { lockedAt: { lte: lockExpiresAt } }],
    },
    take: options.batchSize ?? OUTBOX_BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (const event of events) {
    await options.db.auraOutboxEvent.update({
      where: { id: event.id },
      data: { lockedAt: now, status: "PROCESSING" },
    });

    try {
      const ctx = await options.createContext({
        source: "internal",
        requestId: `outbox_${event.id}`,
      });

      ctx.log.info("Processing outbox event", {
        eventId: event.id,
        type: event.type,
        attempts: event.attempts,
      });

      await createNotificationDispatcher(() => ctx).via(event.type).send(event.payload);

      await options.db.auraOutboxEvent.update({
        where: { id: event.id },
        data: { status: "SUCCEEDED", processedAt: new Date(), lockedAt: null },
      });

      succeeded++;
    } catch (error) {
      const attempts = event.attempts + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const backoffMinutes = Math.min(2 ** attempts, 60);
      const nextRunAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await options.db.auraOutboxEvent.update({
        where: { id: event.id },
        data: {
          status: attempts >= event.maxAttempts ? "FAILED" : "PENDING",
          attempts,
          error: errorMessage,
          nextRunAt,
          lockedAt: null,
        },
      });

      failed++;
    }
  }

  return { processed: events.length, succeeded, failed };
}
