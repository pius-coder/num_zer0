import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { upgradeWebSocket, websocket } from "hono/bun";

const SECRET =
  process.env.AURA_INTERNAL_SECRET ??
  process.env.AURA_CSRF_SECRET ??
  "aura-dev-secret-change-me";
const SIGNATURE_WINDOW_MS = 60_000;
const HEARTBEAT_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 90_000;

interface Client {
  id: string;
  send: (data: string) => void;
  connectedAt: number;
  lastPong: number;
  remote: string | null;
  keys: Set<string>;
}

const clients = new Map<string, Client>();
const subs = new Map<string, Set<string>>();

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function verifySignature(body: string, ts: string | null, sig: string | null): boolean {
  if (!ts || !sig) return false;
  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  if (Math.abs(Date.now() - tsNum) > SIGNATURE_WINDOW_MS) return false;

  const expected = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function startHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    const now = Date.now();
    const payload = JSON.stringify({ type: "PING" });
    for (const [id, client] of clients) {
      if (now - client.lastPong > HEARTBEAT_TIMEOUT_MS) {
        removeClientFromSubs(id);
        clients.delete(id);
        continue;
      }
      try {
        client.send(payload);
      } catch {
        removeClientFromSubs(id);
        clients.delete(id);
      }
    }
  }, HEARTBEAT_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function removeClientFromSubs(clientId: string): void {
  for (const [key, ids] of subs) {
    ids.delete(clientId);
    if (ids.size === 0) subs.delete(key);
  }
}

function routePublish(writeKeys: string[]): Set<string> {
  const targets = new Set<string>();
  for (const wk of writeKeys) {
    const exact = subs.get(wk);
    if (exact) for (const id of exact) targets.add(id);

    if (wk.includes(":")) {
      const tableKey = wk.slice(0, wk.indexOf(":"));
      const tableSubs = subs.get(tableKey);
      if (tableSubs) for (const id of tableSubs) targets.add(id);
    } else {
      for (const [k, ids] of subs) {
        if (k.startsWith(wk + ":")) for (const id of ids) targets.add(id);
      }
    }
  }
  return targets;
}

export function addRealtimeRoutes(app: Hono): void {
  startHeartbeat();

  app.get("/", (c) =>
    c.html(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Aura Realtime</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e4e4e7}main{text-align:center}h1{font-size:2rem;font-weight:600;margin-bottom:.5rem}.status{color:#22c55e;font-weight:500}.info{color:#71717a;font-size:.875rem}</style></head>
<body><main>
  <h1>Aura Realtime</h1>
  <p class="status">● Serveur actif</p>
  <p class="info">${clients.size} client(s) connecté(s) · ${subs.size} clé(s) souscrite(s)</p>
</main></body></html>`),
  );

  app.get("/clients", (c) =>
    c.json({
      count: clients.size,
      clients: [...clients.values()].map((it) => ({
        id: it.id,
        connectedAt: it.connectedAt,
        lastPong: it.lastPong,
        remote: it.remote,
        keys: [...it.keys],
      })),
    }),
  );

  app.post("/publish", async (c) => {
    const body = await c.req.text();
    if (!verifySignature(body, c.req.header("x-aura-timestamp") ?? null, c.req.header("x-aura-signature") ?? null)) {
      return c.json({ ok: false, reason: "invalid-signature" }, 403);
    }

    let parsed: { keys?: unknown };
    try {
      parsed = JSON.parse(body);
    } catch {
      return c.json({ ok: false, reason: "invalid-json" }, 400);
    }

    if (!Array.isArray(parsed.keys) || parsed.keys.some((k) => typeof k !== "string")) {
      return c.json({ ok: false, reason: "invalid-payload" }, 400);
    }

    const writeKeys = parsed.keys as string[];
    const payload = JSON.stringify({
      type: "INVALIDATE",
      id: randomUUID(),
      keys: writeKeys,
    });

    const targets = routePublish(writeKeys);
    let sent = 0;
    for (const id of targets) {
      const client = clients.get(id);
      if (!client) continue;
      try {
        client.send(payload);
        sent += 1;
      } catch {
        removeClientFromSubs(id);
        clients.delete(id);
      }
    }
    console.log(`[aura:realtime] publish → ${sent} client(s) [${writeKeys.join(", ")}]`);
    return c.json({ ok: true, relayed: sent });
  });

  app.get(
    "/ws",
    upgradeWebSocket((c) => {
      const remote =
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        c.req.header("x-real-ip") ??
        null;
      let id: string | null = null;

      return {
        onOpen(_evt, ws) {
          id = randomUUID();
          const now = Date.now();
          const client: Client = {
            id,
            send: (data) => ws.send(data),
            connectedAt: now,
            lastPong: now,
            remote,
            keys: new Set(),
          };
          clients.set(id, client);
          console.log(`[aura:realtime] open ${id} (total: ${clients.size})`);
        },
        onMessage(evt) {
          if (!id) return;
          const client = clients.get(id);
          if (!client) return;
          try {
            const msg = JSON.parse(evt.data as string);
            if (msg.type === "PONG" || msg.type === "PING") {
              client.lastPong = Date.now();
              return;
            }
            if (msg.type === "SUB" && Array.isArray(msg.keys)) {
              for (const k of msg.keys) {
                client.keys.add(k);
                if (!subs.has(k)) subs.set(k, new Set());
                subs.get(k)!.add(id!);
              }
              return;
            }
            if (msg.type === "UNSUB" && Array.isArray(msg.keys)) {
              for (const k of msg.keys) {
                client.keys.delete(k);
                subs.get(k)?.delete(id!);
                if (subs.get(k)?.size === 0) subs.delete(k);
              }
              return;
            }
          } catch {
            /* ignore malformed */
          }
        },
        onClose() {
          if (id) {
            removeClientFromSubs(id);
            clients.delete(id);
            console.log(`[aura:realtime] close ${id} (total: ${clients.size})`);
          }
        },
        onError() {
          if (id) {
            removeClientFromSubs(id);
            clients.delete(id);
          }
        },
      };
    }),
  );

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

function shutdown(signal: string) {
  console.log(`[aura:realtime] ${signal} — closing ${clients.size} client(s)`);
  for (const [, c] of clients) {
    try {
      c.send(JSON.stringify({ type: "CLOSING" }));
    } catch {
      /* noop */
    }
  }
  clients.clear();
  subs.clear();
  stopHeartbeat();
}

export { websocket };
