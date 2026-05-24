# Auria Stack v3 — Plan d'Architecture

## Vision

Auria Stack est un framework full-stack React type-safe avec architecture **Convex-like** :
- Backend Hono déployable séparément
- Frontend React (SSR initial uniquement, tout le reste via hooks + WebSocket)
- Invalidation 100% automatique via entity tracker Prisma
- Dashboard Coolify-like pour monitorer toutes les opérations en temps réel

---

## Structure Monorepo

```
auria/
├── package.json               # workspaces: ["packages/*", "apps/*"]
├── pnpm-workspace.yaml
├── tsconfig.json              # base config
├── turbo.json                 # pipeline de build
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
│
├── packages/
│   ├── core/                  # @auria/core — ZERO DEP RUNTIME
│   │   ├── src/
│   │   │   ├── types.ts       # OperationRef, AgentRef, ThreadRef
│   │   │   ├── envelope.ts    # AuriaEnvelope, success/error helpers
│   │   │   ├── errors.ts      # AuriaError hierarchy
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── server/                # @auria/server — BACKEND RUNTIME
│   │   ├── src/
│   │   │   ├── index.ts       # createAuriaApp()
│   │   │   ├── app.ts         # Hono app factory
│   │   │   ├── operation/
│   │   │   │   ├── builder.ts # defineOperation() builder API
│   │   │   │   ├── registry.ts# OperationRegistry (Map)
│   │   │   │   └── runner.ts  # runOperation() avec entity tracker
│   │   │   ├── context/
│   │   │   │   ├── factory.ts # createAuriaContext()
│   │   │   │   ├── session.ts # Session from cookie
│   │   │   │   └── call.ts    # In-process calls
│   │   │   ├── transport/
│   │   │   │   ├── hono-app.ts# Mounts all sub-routers
│   │   │   │   ├── routes/
│   │   │   │   │   ├── bridge.ts     # POST /aura/*
│   │   │   │   │   ├── internal.ts   # POST /aura-internal/*
│   │   │   │   │   ├── files.ts      # GET /files/*
│   │   │   │   │   ├── health.ts     # GET /health
│   │   │   │   │   └── http-actions.ts # POST /aura-http/*
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── csrf.ts       # CSRF double-submit cookie
│   │   │   │   │   └── rate-limit.ts # Rate limiting
│   │   │   │   └── cookies.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts  # Prisma singleton
│   │   │   │   ├── readonly.ts# Read-only Prisma Proxy
│   │   │   │   └── tracker.ts # Entity-tracker Proxy (auto-invalidation)
│   │   │   ├── auth/
│   │   │   │   ├── session.ts
│   │   │   │   ├── password.ts
│   │   │   │   ├── otp.ts
│   │   │   │   └── operations.ts
│   │   │   ├── ai/
│   │   │   │   ├── agent.ts
│   │   │   │   └── context-binding.ts
│   │   │   ├── scheduler/
│   │   │   │   ├── scheduler.ts
│   │   │   │   ├── runner.ts
│   │   │   │   └── cron.ts
│   │   │   ├── workflows.ts
│   │   │   ├── outbox.ts
│   │   │   ├── search.ts
│   │   │   ├── vector.ts
│   │   │   ├── pagination.ts
│   │   │   ├── notifications.ts
│   │   │   ├── storage/
│   │   │   │   ├── types.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── filesystem.ts
│   │   │   │   └── s3.ts
│   │   │   ├── broadcast/
│   │   │   │   ├── server.ts     # WebSocket + HTTP broadcast
│   │   │   │   └── publish.ts    # publishInvalidation()
│   │   │   ├── discovery.ts
│   │   │   └── vite-plugin.ts
│   │   └── package.json
│   │
│   ├── client/               # @auria/client — FRONTEND RUNTIME
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── provider.tsx     # AuriaProvider (QueryClient + BC + WS)
│   │   │   ├── hooks.ts        # useQuery, useMutation, useManifest
│   │   │   ├── transport.ts    # callOperation(), CSRF auto-heal
│   │   │   ├── form.ts         # useAuriaForm
│   │   │   ├── guard.tsx       # Auth guard
│   │   │   ├── paginated-query.ts
│   │   │   ├── agent.ts
│   │   │   ├── params.ts
│   │   │   ├── stepper.ts
│   │   │   ├── manifest-cache.ts
│   │   │   └── hydration-boundary.tsx
│   │   └── package.json
│   │
│   ├── cli/                  # @auria/cli — CLI OUTILS
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── commands/
│   │   │       ├── make.ts
│   │   │       ├── codegen.ts
│   │   │       ├── doctor.ts
│   │   │       ├── cron.ts
│   │   │       └── outbox.ts
│   │   └── package.json
│   │
│   ├── ui/                   # @auria/ui — UI COMPONENTS
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── aura-data-table.tsx
│   │   │   ├── aura-form.tsx
│   │   │   ├── aura-auth-card.tsx
│   │   │   ├── aura-agent-chat.tsx
│   │   │   ├── aura-dashboard-shell.tsx
│   │   │   ├── aura-empty-state.tsx
│   │   │   ├── aura-bump-toaster.tsx
│   │   │   ├── aura-confirm-dialog.tsx
│   │   │   ├── aura-file-upload.tsx
│   │   │   ├── aura-search-input.tsx
│   │   │   ├── aura-error-boundary.tsx
│   │   │   ├── aura-loading-skeleton.tsx
│   │   │   ├── aura-settings-layout.tsx
│   │   │   └── aura-guard-view.tsx
│   │   └── package.json
│   │
│   └── create-app/           # create-auria-app
│       ├── src/index.ts
│       └── template/
│
├── apps/
│   ├── api/                  # BACKEND DÉPLOYABLE
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── aura.config.ts
│   │   │   └── operations/
│   │   │       ├── _registry.ts
│   │   │       ├── system/health.operation.ts
│   │   │       └── todos/
│   │   ├── prisma/schema.prisma
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── dashboard/            # DASHBOARD COOLIFY-LIKE
│   │   ├── src/
│   │   │   ├── client.tsx
│   │   │   ├── router.tsx
│   │   │   ├── server.ts
│   │   │   ├── app/
│   │   │   │   └── routes/
│   │   │   │       ├── __root.tsx
│   │   │   │       ├── index.tsx
│   │   │   │       ├── operations.tsx
│   │   │   │       ├── logs.tsx
│   │   │   │       ├── database.tsx
│   │   │   │       ├── jobs.tsx
│   │   │   │       ├── agents.tsx
│   │   │   │       ├── users.tsx
│   │   │   │       ├── storage.tsx
│   │   │   │       ├── settings.tsx
│   │   │   │       └── api-keys.tsx
│   │   │   ├── components/
│   │   │   │   ├── overview-cards.tsx
│   │   │   │   ├── realtime-log-stream.tsx
│   │   │   │   ├── operations-table.tsx
│   │   │   │   ├── metrics-chart.tsx
│   │   │   │   └── deployment-status.tsx
│   │   │   └── hooks/
│   │   │       ├── use-operations.ts
│   │   │       ├── use-logs.ts
│   │   │       └── use-metrics.ts
│   │   ├── aura.config.ts
│   │   ├── prisma/schema.prisma
│   │   └── package.json
│   │
│   └── example/              # STARTER APP
│
├── docs/
│   ├── architecture.md
│   ├── getting-started.md
│   ├── operations.md
│   └── deployment.md
└── prisma/schema.prisma      # Shared
```

---

## Phases d'implémentation

### Phase 0 : Nettoyage Architectural Critique

**0.1** — Suppression de `ctx.invalidate()` — Invalidation 100% entités automatiques
- Brancher l'`entity-tracker.ts` (Proxy Prisma) dans le runner
- Le tracker enveloppe le PrismaClient dans le contexte
- Après handler, `tracker.writes` devient le set d'invalidation
- Supprimer `ctx.invalidate()` et `ctx.invalidatedEntities` du contexte
- `.entities([...])` reste optionnel (entités hors Prisma)

```
Runner flow:
1. createTrackedPrismaClient(ctx.db) → { client, tracker }
2. Handler s'exécute avec trackedDb
3. ctx.db.todo.create(...) → tracker.writes.add("Todo")
4. Après handler: invalidates = [...operation.entities, ...tracker.writes]
5. publishInvalidation({ keys: invalidates })
```

**0.2** — Séparation Backend / Frontend
- `apps/api/` = serveur Hono standalone
- `apps/dashboard/` = app React (SSR initial, hooks ensuite)

### Phase 1 : Structure Monorepo
- Créer tous les packages, apps, configs (pnpm workspace, turbo, tsconfig)
- Rename `aura` → `auria` dans tout le codebase

### Phase 2 : Builder API `().()` (DDX)
- Nouveau builder : `auria.operation("name").type("mutation").input(z).handler(fn)`
- API client chaînée : `api.todos().list({ input })` au lieu de `api.todos.list`
- Codegen update pour générer des fonctions au lieu d'objets

### Phase 3 : Entity Tracker Runner
- Wire `createTrackedPrismaClient` dans le runner
- Remplacer l'invalidation manuelle par l'auto-detection
- Supprimer `ctx.invalidate` de tous les types

### Phase 4 : Dashboard Coolify-like
- 10 pages (Overview, Operations, Logs, DB, Jobs, Agents, Users, Storage, Settings, API Keys)
- Opérations dashboard préfixées `dashboard.*`
- Temps réel via WebSocket broadcast
- Composants : stats-cards, realtime-log-stream, operations-table, metrics-chart

### Phase 5 : Déploiement Deux Bases

**Backend (apps/api)** :
```dockerfile
FROM oven/bun:1
EXPOSE 3001
CMD ["bun", "dist/server.js"]
```
Routes : `POST /aura/*`, `GET /aura/_manifest`, `POST /aura-internal/*`, `POST /aura-http/*`, `GET /files/*`, `GET /health`, `WS /ws`

**Frontend (apps/dashboard)** :
- Build static → Vercel / Cloudflare Pages
- SSR initial uniquement (1er fetch)
- Tout le reste via hooks + WebSocket temps réel

### Phase 6 : Rename `aura` → `auria`
- `@aura/*` → `@auria/*`
- `AuraError` → `AuriaError`
- `AuraContext` → `AuriaContext`
- Variables d'env `AURA_*` → `AURIA_*`

---

## Architecture d'invalidation automatique

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW D'INVALIDATION                                         │
│                                                             │
│ Opération :                                                  │
│   defineOperation("todos.create").type("mutation")           │
│     .input(z.object({ title: z.string() }))                 │
│     .handler(async ({ ctx, input }) => {                    │
│       const t = await ctx.db.todo.create({ data: input })   │
│       await ctx.db.user.update(...)                         │
│       return t                                              │
│     })                                                      │
│                                                             │
│ Runner :                                                    │
│   const { client, tracker } = createTrackedPrismaClient(db) │
│   const data = await handler({ ctx: { ...ctx, db: client } })│
│   // tracker.writes = { "Todo", "User" }                    │
│   invalidates = [...operation.entities, ...tracker.writes]  │
│   publishInvalidation({ keys: invalidates })                │
│                                                             │
│ Broadcast :                                                 │
│   POST /invalidate (HMAC signé) → WebSocket fanout          │
│                                                             │
│ Client :                                                    │
│   WebSocket reçoit → invalidateQueries predicate            │
│   → refetch automatique des queries qui matchent            │
└─────────────────────────────────────────────────────────────┘
```

## Dashboard Coolify — Pages et opérations

| Route | Page | Opérations |
|-------|------|------------|
| `/` | Overview | `dashboard.overview.stats` |
| `/operations` | Operations | `dashboard.operations.list`, `.recent` |
| `/logs` | Logs | `dashboard.logs.stream` (WS) |
| `/database` | Database | `dashboard.db.status`, `.migrations` |
| `/jobs` | Jobs | `dashboard.jobs.list`, `.run` |
| `/agents` | Agents | `dashboard.agents.threads`, `.usage` |
| `/users` | Users | `dashboard.users.list`, `.sessions` |
| `/storage` | Storage | `dashboard.storage.usage` |
| `/settings` | Settings | `dashboard.settings.get`, `.update` |
| `/api-keys` | API Keys | `dashboard.apikeys.list`, `.create` |

## Conventions

- Namespace packages : `@auria/*`
- Suffixes fichiers : `.operation.ts`, `.agent.ts`, `.cron.ts`, `.workflow.ts`, `.http.ts`, `.search.ts`, `.vector.ts`, `.db-read.ts`, `.component.ts`
- Auto-discovery : le codegen scane les dossiers et génère `_registry.ts` + `api.ts`
- Noms en kebab-case, chemins deviennent noms dotted (ex: `todos/list.operation.ts` → `todos.list`)
- Le dashboard utilise Auria lui-même comme backend (scratch your own itch)
