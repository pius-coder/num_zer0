import { createHmac, randomUUID } from "node:crypto";
import type { PublishInvalidationOptions } from "./types";

function resolveBroadcastHttpUrl(): string | null {
  const explicit = process.env.AURA_BROADCAST_INTERNAL_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const wsUrl = process.env.VITE_AURA_WS_URL ?? process.env.NEXT_PUBLIC_AURA_WS_URL;
  if (!wsUrl) return null;

  try {
    const parsed = new URL(wsUrl);
    const httpProtocol = parsed.protocol === "wss:" ? "https:" : "http:";
    const base = `${httpProtocol}//${parsed.host}`;
    return base;
  } catch {
    return null;
  }
}

function resolveSecret(): string {
  return process.env.AURA_INTERNAL_SECRET ?? process.env.AURA_CSRF_SECRET ?? "aura-dev-secret-change-me";
}

export function signInvalidationPayload(
  body: string,
  timestamp: string,
  secret?: string,
): string {
  return createHmac("sha256", secret ?? resolveSecret()).update(`${timestamp}.${body}`).digest("hex");
}

export async function publishInvalidation(
  options: PublishInvalidationOptions,
): Promise<{ ok: boolean; reason?: string }> {
  if (options.keys.length === 0) return { ok: true };

  const baseUrl = options.broadcastUrl ?? resolveBroadcastHttpUrl();
  if (!baseUrl) {
    return { ok: true, reason: "broadcast-not-configured" };
  }

  const body = JSON.stringify({
    id: randomUUID(),
    keys: [...new Set(options.keys)],
  });
  const timestamp = String(Date.now());
  const signature = signInvalidationPayload(body, timestamp, options.secret);

  try {
    const response = await fetch(`${baseUrl}/invalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-aura-timestamp": timestamp,
        "x-aura-signature": signature,
      },
      body,
      signal: options.signal,
      keepalive: true,
    });

    if (!response.ok) {
      return { ok: false, reason: `status-${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[aura:invalidate] broadcast publish failed:", message);
    return { ok: false, reason: message };
  }
}
