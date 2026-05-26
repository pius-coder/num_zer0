/**
 * Server-to-server invalidation publishing.
 *
 * Called by the Aura runner after every mutation. The broadcast server
 * fans the keys out to all connected WS clients, which filter locally
 * based on the entities their active queries observe.
 */

import { createHmac } from "node:crypto";

const DEFAULT_BROADCAST_URL = "http://localhost:3001";
const DEFAULT_SECRET = "aura-dev-secret-change-me";

function broadcastUrl(): string {
  return (process.env.AURA_REALTIME_INTERNAL_URL ?? DEFAULT_BROADCAST_URL).replace(/\/$/, "");
}

function secret(): string {
  return process.env.AURA_INTERNAL_SECRET ?? process.env.AURA_CSRF_SECRET ?? DEFAULT_SECRET;
}

export function signPublishPayload(body: string, timestamp: string, key = secret()): string {
  return createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex");
}

export async function publishInvalidation(keys: readonly string[]): Promise<void> {
  if (keys.length === 0) return;

  const body = JSON.stringify({ keys: [...new Set(keys)] });
  const timestamp = String(Date.now());
  const signature = signPublishPayload(body, timestamp);

  try {
    const response = await fetch(`${broadcastUrl()}/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-aura-timestamp": timestamp,
        "x-aura-signature": signature,
      },
      body,
      keepalive: true,
    });
    if (!response.ok) {
      console.warn(`[aura:realtime] publish returned ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[aura:realtime] publish failed: ${message}`);
  }
}
