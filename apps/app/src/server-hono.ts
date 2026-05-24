import { serve } from "@hono/node-server"
import { createAuraHonoApp } from "@aura-js/core/server/hono-app"

import "./operations/_registry"

const app = createAuraHonoApp()
const port = Number(process.env.PORT ?? 3001)

console.log(`[aura:backend] listening on :${port}`)
serve({ fetch: app.fetch, port })
