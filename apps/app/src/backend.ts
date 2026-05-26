import { websocket } from "hono/bun";
import { createAuraHonoApp } from "@aura-js/core/server/hono-app";
import { addRealtimeRoutes } from "@aura/realtime/server";

const app = await createAuraHonoApp();
addRealtimeRoutes(app);

const port = Number(process.env.PORT ?? 3001);
console.log(`[aura:backend] listening on :${port} (+WS /ws)`);

Bun.serve({ port, fetch: app.fetch, websocket });
