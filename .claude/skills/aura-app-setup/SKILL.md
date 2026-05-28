---
name: aura-app-setup
description: "Aura app server wiring and deployment. Use when setting up the Hono server, configuring routes, Docker deployment, or environment variables."
---

# Aura App Setup

## Hono server
```ts
import { createAuraHonoApp } from "@/aura/server";
const app = await createAuraHonoApp();
```

This sets up:
- `createAuraHonoApp()` → Hono app with all routes

### Routes mounted
| Path | Router | Description |
|---|---|---|
| `/aura/*` | `auraBridgeRouter()` | Public bridge: GET `/_manifest`, POST `/:path` |
| `/aura-internal/*` | `auraInternalRouter()` | Internal-only operations |
| `/files/*` | `auraFilesRouter()` | File serving (DB lookup + legacy free-path) |
| `/health` | `auraHealthRouter()` | Health check |
| `/aura-http/*` | `auraHttpActionsRouter()` | HTTP action definitions |
| `/dashboard/*` | `auraDashboardRouter()` | Dev dashboard (dev-only unless `AURA_DASHBOARD_ENABLED=1`) |

### Middleware
- CORS (`origin: AURA_APP_URL`, credentials: true)
- Request logger (`[aura] METHOD /path STATUS DURATIONms`)
- Rate limiter on `/aura/*` (120 req/min)
- CSRF on bridge routes
- Optional API key middleware

## Operation registry
`apps/app/src/operations/_registry.ts` imports all operation modules. `apps/app/src/aura.registry.ts` re-exports registry + auth operations.

## TanStack Start entry
`apps/app/src/server.ts`:
```ts
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import "./operations/_registry";
const handler = createStartHandler(defaultStreamHandler);
export default { fetch: handler };
```

## Environment variables

### Required
| Variable | Description |
|---|---|
| `AURA_APP_URL` | Frontend origin for CORS (e.g., `http://localhost:3000`) |
| `AURA_INTERNAL_SECRET` | HMAC secret for CSRF + realtime signing |
| `DATABASE_URL` | Prisma database URL |
| `VITE_AURA_WS_URL` | WebSocket URL for clients (build-time) |

### Optional
| Variable | Description |
|---|---|
| `AURA_REALTIME_INTERNAL_URL` | Realtime server URL (default `http://localhost:3001`) |
| `AURA_DASHBOARD_ENABLED` | Enable dashboard in production (`1`/`true`) |
| `AURA_API_KEY` | API key for dashboard auth |
| `AURA_STORAGE_PATH` | File storage path (default `storage/files`) |
| `PORT` | Server port |

## Docker
- `Dockerfile.backend` — builds via `build:backend`, serves `backend/backend.js` on `:3001`
- `Dockerfile.frontend` — builds via `build`, serves `.output/server/index.mjs` on `:3000`
- Build args: `VITE_AURA_URL`, `VITE_AURA_WS_URL`

## Source files
- `packages/aura/src/server/hono-app.ts` — createAuraHonoApp
- `packages/aura/src/server/routes/bridge.ts` — auraBridgeRouter
- `apps/app/src/server.ts` — TanStack Start entry
- `Dockerfile.backend`, `Dockerfile.frontend`
