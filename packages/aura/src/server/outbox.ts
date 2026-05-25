

import { db } from "./db";
import { createAuraContext } from "./create-context";
import { processOutboxEvents as processNotificationsOutboxEvents } from "@aura/notifications";

const OUTBOX_BATCH_SIZE = 100;

export async function processOutboxEvents(batchSize = OUTBOX_BATCH_SIZE): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  return processNotificationsOutboxEvents({ db, createContext: createAuraContext, batchSize });
}
