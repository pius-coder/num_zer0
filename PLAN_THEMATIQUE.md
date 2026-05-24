# Plan Aura — Architecture par Thèmes

> Ce plan complète PLAN.md. Organisé par thèmes indépendants, priorité au split déploiement et au dashboard.

---

## Thème 1 — Split Déploiement : Comment produire deux artefacts depuis un seul package

### 1.1 État actuel des lieux

**Architecture actuelle (dev + prod = même binaire) :**

```
Request ──► src/server.ts
               ├── /aura/* ──► Hono (createAuraHonoApp)
               ├── /aura-internal/* ──► Hono
               ├── /files/* ──► Hono
               ├── /health ──► Hono
               └── /* ──► TanStack Start SSR (createStartHandler)
```

- **Entrypoint unique** : `src/server.ts` (62 lignes) — routing conditionnel entre Hono et TanStack
- **Build actuel** : `vite build` (TanStack Start plugin) → tout dans `.output/`
- **Dev** : `concurrently vite + broadcast` — tout dans le même process
- **Broadcast** : processus séparé (`bun src/aura/server/broadcast.ts`)

**Fichiers clés existants :**
| Fichier | Rôle |
|---|---|
| `src/server.ts` | Entrypoint qui route Hono vs TanStack |
| `src/aura/server/hono-app.ts` | Factory Hono (bridge, internal, files, health, http-actions) |
| `src/aura/server/broadcast.ts` | Serveur WebSocket standalone |
| `vite.config.ts` | Config TanStack Start plugin |

### 1.2 Le problème : un seul build, deux cibles

Actuellement `vite build` produit un seul artifact Nitro (`.output/`) qui contient **à la fois** Hono et TanStack Start. Impossible de déployer le backend sans le frontend, ou vice-versa.

**Contrainte** : pas de monorepo, pas de codegen, un seul `package.json`.

### 1.3 La solution : deux entrypoints, un seul package

Le principe : le code est partagé (même `src/`), mais on a deux entrypoints différents pour le build.

```
src/
├── server.ts              ← entrypoint actuel (dev + TanStack Start build)
├── server-hono.ts         ← NOUVEAU : entrypoint Hono standalone (prod backend)
└── aura/server/hono-app.ts ← factory partagée (inchangée)
```

#### Entrypoint backend standalone

```typescript
// src/server-hono.ts — NOUVEAU
// Point d'entrée pour le backend Hono en production
// Build séparé avec tsup, déployé comme service indépendant

import { serve } from "@hono/node-server"
import { createAuraHonoApp } from "./aura/server/hono-app"

const app = createAuraHonoApp()
const port = Number(process.env.PORT ?? 3001)

console.log(`[aura:backend] listening on :${port}`)
serve({ fetch: app.fetch, port })
```

#### Scripts de build

```json
{
  "scripts": {
    "dev": "prisma generate && concurrently -n vite,broadcast -c blue,magenta \"vite dev --port 3000\" \"bun src/aura/server/broadcast.ts\"",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsup src/server-hono.ts --out-dir build/backend --format esm --target node22",
    "start:backend": "node build/backend/server-hono.js",
    "start:frontend": "node .output/server/index.mjs"
  }
}
```

**Le build `build:frontend`** (TanStack Start) produit son `.output/` normal. Mais en prod, ce server ne gère PLUS les routes `/aura/*` — il les proxy vers le backend.

#### Comment TanStack Start proxy vers Hono en prod

**Option A (recommandée) : RouteRules Nitro**

```typescript
// app.config.ts (ou vite.config.ts)
export default defineConfig({
  server: {
    routeRules: {
      '/aura/**': { proxy: process.env.AURA_BACKEND_URL ?? 'http://localhost:3001' },
      '/aura-internal/**': { proxy: process.env.AURA_BACKEND_URL ?? 'http://localhost:3001' },
      '/files/**': { proxy: process.env.AURA_BACKEND_URL ?? 'http://localhost:3001' },
      '/health': { proxy: process.env.AURA_BACKEND_URL ?? 'http://localhost:3001' },
    },
  },
})
```

Nitro proxy nativement les requêtes. En dev, `AURA_BACKEND_URL` pointe sur le serveur Hono. En prod, sur le backend deployé.

**Option B : Proxy inverse externe (nginx, Cloudflare)**

```
                      ┌──────────────────┐
                      │   nginx / CF      │
                      │                   │
Request ─────────────►│  /aura/* → Hono   │
                      │  /* → TanStack    │
                      └──────────────────┘
```

Plus simple, pas de config Nitro. Mais ajoute une couche d'infra.

**Option C : Hono toujours devant, même en prod**

```typescript
// src/server.ts adapté pour prod
const app = new Hono()

// Routes Aura
app.route("/aura", auraBridgeRouter())
// ...

// En prod, TanStack Start est un service séparé
app.all("*", async (c) => {
  const upstream = process.env.FRONTEND_URL ?? "http://localhost:3000"
  return fetch(`${upstream}${c.req.url}`)
})
```

**Décision provisoire** : Option A (RouteRules Nitro) — zéro infra supplémentaire, config déclarative.

### 1.4 Architecture cible (prod split)

```
                    ┌─────────────────────┐
                    │   Browser / Client   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Domaine unique     │
                    │   (example.com)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Nitro (TanStack)   │
                    │   RouteRules proxy   │
                    └──────┬──────────┬───┘
                           │          │
              ┌────────────▼──┐  ┌────▼──────────┐
              │  Hono Backend  │  │  React SSR     │
              │  (port 3001)   │  │  (port 3000)   │
              │                │  │                │
              │  /aura/*       │  │  /*            │
              │  /health       │  │                │
              │  WS broadcast  │  │                │
              └────────────────┘  └────────────────┘
```

### 1.5 Ce qui change concrètement

| Fichier | Action |
|---|---|
| `src/server-hono.ts` | **CRÉER** — Entrypoint Hono standalone |
| `app.config.ts` | **CRÉER** — RouteRules Nitro pour proxy |
| `package.json` | **MODIFIER** — Ajouter `build:backend`, `build:frontend`, scripts start |
| `.env.production` | **CRÉER** — `AURA_BACKEND_URL`, `VITE_AURA_URL` |
| `Dockerfile.backend` | **CRÉER** — Build + run l'artifact backend |
| `Dockerfile.frontend` | **CRÉER** — Build + run l'artifact frontend |
| `src/server.ts` | **INCHANGÉ** — Utilisé par TanStack Start comme entrypoint SSR |

### 1.6 Ce qui ne change pas

- `src/aura/server/hono-app.ts` — la factory est déjà propre et réutilisable
- `src/aura/server/broadcast.ts` — déjà standalone, juste à configurer l'URL de prod
- `src/aura/server/routes/*` — les routes Hono sont déjà montées dans la factory
- Les types partagés — toujours dans le même package, pas de duplication

### 1.7 Déploiement Docker

```dockerfile
# Dockerfile.backend
FROM oven/bun:latest AS build
COPY . /app
RUN npm run build:backend

FROM oven/bun:latest
COPY --from=build /app/build/backend /app
ENV PORT=3001
EXPOSE 3001
CMD ["bun", "server-hono.js"]
```

```dockerfile
# Dockerfile.frontend
FROM node:22-slim AS build
COPY . /app
RUN npm run build:frontend

FROM node:22-slim
COPY --from=build /app/.output /app/.output
ENV PORT=3000
EXPOSE 3000
CMD ["node", "/app/.output/server/index.mjs"]
```

### 1.8 Ce qui reste à trancher

| Question | Options | Statut |
|---|---|---|
| Build backend | tsup / esbuild / Bun build | À tester |
| Proxy en prod | RouteRules Nitro / nginx / Hono devant | **À décider** |
| WebSocket en prod | Même serveur Hono / serveur dédié (broadcast) | broadcast déjà standalone ✅ |
| Auth inter-services | JWT / API Key / Cookie partagé | À décider |
| Déploiement | Docker Compose / Coolify / fly.io | À décider |
| Base de données | Partagée (même PG) = déjà le cas ✅ | Résolu |

---

## Thème 2 — Dashboard : Analyse de Convex et notre implémentation

### 2.1 Analyse du dashboard Convex

Le dashboard Convex est une **SPA React standalone** hébergée sur `dashboard.convex.dev`. Elle se connecte à chaque déploiement via une API authentifiée.

#### Pages et fonctionnalités

| Page | Fonctionnalités | Sources de données |
|---|---|---|
| **Functions** | Liste toutes les functions déployées. Lancer une function avec des arguments arbitraires. Voir le résultat, les logs, le temps d'exécution. Metrics par function : invocations/min, errors/min, cache hit rate, execution time (p50/p90/p95/p99). | API backend (function registry), event stream |
| **Logs** | Stream temps réel des exécutions. Filtre par nom de function, status (success/error), sévérité (info/warn/debug/error), request ID. Vue groupée par request ID (toutes les logs d'une même requête). | Event stream WebSocket + historique |
| **Data** | Browse tables, pagination, documents individuels, filtres, édition inline, custom queries. | API backend directe |
| **Deployments** | Historique des déploiements, version actuelle | API backend |
| **Settings** | Team settings, usage metrics, environnement variables | API backend |
| **Health** | Cache hit rate, scheduler lag, Convex version, update button | API backend + metrics |

#### Architecture des logs Convex

```
Function execution
       │
       ▼
┌────────────────┐
│  Log Stream     │──► WebSocket ──► Dashboard (temps réel)
│  (in-memory)    │──► REST API ──► Dashboard (historique, 1000 dernières)
└────────────────┘
       │
       ▼
┌────────────────┐
│  Log Stream     │──► Axiom / Datadog / Sentry / Webhook
│  (intégration)  │    (rétention illimitée, alerting)
└────────────────┘
```

Chaque log event contient :
```
{
  topic: "function_execution" | "console" | "current_storage_usage",
  function: { path: string, type: "query"|"mutation"|"action", request_id: string },
  status: "success" | "error",
  error_message?: string,
  duration_ms: number,
  log_level?: "info" | "warn" | "error" | "debug",
  message?: string,
  resource_usage: {
    database_io_read_bytes: number,
    database_io_write_bytes: number,
    execution_time_ms: number,
    // ...
  },
  timestamp: Date
}
```

#### Metrics Convex (par function)

4 graphiques par function :
1. **Invocations** — nombre d'appels/minute
2. **Errors** — exceptions/minute
3. **Cache Hit Rate** — % de queries servies depuis le cache (query seulement)
4. **Execution Time** — p50, p90, p95, p99 en ms

Ces metrics sont calculées à partir du stream de logs et stockées dans une base de metrics séparée.

### 2.2 Ce qu'on peut reproduire — et ce qui est overkill

| Fonctionnalité | Priorité | Justification |
|---|---|---|
| **Logs temps réel** | 🔴 Critique | Debug en dev + monitoring en prod |
| **Run function depuis le dashboard** | 🔴 Critique | Tester des ops sans UI |
| **Erreurs / stack traces** | 🔴 Critique | Savoir ce qui plante en prod |
| **Liste des functions** | 🟡 Haute | Voir ce qui est déployé |
| **Metrics (latence, taux d'erreur)** | 🟡 Haute | Monitoring perf |
| **Data browser (tables/documents)** | 🟢 Moyenne | Utile mais pas urgent |
| **Cache hit rate** | ⚪ Basse | Spécifique Convex, pas notre modèle |
| **Deployment history** | ⚪ Basse | On verra plus tard |
| **Log streaming vers Axiom/Datadog** | ⚪ Basse | Future feature |

### 2.3 Architecture de notre dashboard

Le dashboard est une **SPA React servie par Hono**, indépendante du frontend principal.

```
┌──────────────────────────────────────────────┐
│              Hono Backend                     │
│                                               │
│  /aura/rpc  ──► Opérations                    │
│  /dashboard/api/*  ──► Dashboard API          │
│  /dashboard/*  ──► SPA dashboard (served)     │
│  /ws/aura  ──► WebSocket (logs temps réel)    │
│  /health ──► Health check                     │
└──────────────────────────────────────────────┘
```

Pourquoi standalone et pas intégré au frontend principal :
- Le dashboard doit fonctionner **même si le frontend principal est down**
- Le dashboard est un outil **d'infrastructure**, pas un outil utilisateur
- Il peut être **déployé avec le backend** (même service)
- Pas de pollution du bundle frontend principal

#### Routes dashboard (Hono)

```typescript
// src/aura/server/dashboard/routes.ts

// API REST
router.get("/dashboard/api/functions", listFunctions)       // Toutes les ops enregistrées
router.get("/dashboard/api/functions/:name", getFunction)   // Détail + metrics
router.post("/dashboard/api/functions/:name/run", runFunction)  // Exécuter une op
router.get("/dashboard/api/logs", getLogs)                  // Historique des logs
router.get("/dashboard/api/metrics", getMetrics)            // Aggrégations
router.get("/dashboard/api/errors", getErrors)              // Erreurs récentes

// WebSocket pour logs temps réel
router.get("/ws/dashboard", dashboardWebSocket)

// Frontend (SPA servie statiquement)
router.get("/dashboard", serveDashboard)
router.get("/dashboard/*", serveDashboardAssets)
```

#### Capture des logs et des métriques

Le système de logging est un **EventBus in-memory** qui collecte toutes les exécutions :

```typescript
// src/aura/server/observability/event-bus.ts

interface ExecutionEvent {
  type: "query" | "mutation" | "action"
  name: string
  status: "success" | "error"
  durationMs: number
  error?: string
  timestamp: Date
  requestId: string
  consoleLogs: ConsoleLog[]
}

interface ConsoleLog {
  level: "info" | "warn" | "error" | "debug"
  message: string
  timestamp: Date
}

class EventBus {
  private subscribers: Set<(event: ExecutionEvent) => void> = new Set()
  private recentLogs: ExecutionEvent[] = []  // Buffer circulaire (dernières 1000)

  emit(event: ExecutionEvent): void {
    this.recentLogs.push(event)
    if (this.recentLogs.length > 1000) this.recentLogs.shift()

    for (const sub of this.subscribers) {
      sub(event)
    }
  }

  subscribe(fn: (event: ExecutionEvent) => void): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  getRecent(): ExecutionEvent[] {
    return [...this.recentLogs]
  }
}

export const eventBus = new EventBus()
```

#### Capture Console.log dans les ops

Chaque opération `defineOperationFn` peut capter les `console.log` :

```typescript
// Dans le handler runner Aura
const logs: ConsoleLog[] = []
const originalLog = console.log
console.log = (...args) => {
  logs.push({ level: "info", message: args.join(" "), timestamp: new Date() })
  originalLog(...args)
}

try {
  const result = await handler(ctx, input)
  eventBus.emit({
    type: ctx.operationType,
    name: ctx.operationName,
    status: "success",
    durationMs: performance.now() - start,
    timestamp: new Date(),
    requestId: ctx.requestId,
    consoleLogs: logs,
  })
  return result
} finally {
  console.log = originalLog
}
```

#### Metrics computation

Les métriques sont calculées en agrégeant les events :

```typescript
// src/aura/server/observability/metrics.ts

interface FunctionMetrics {
  invocations1m: number
  errors1m: number
  avgLatency1m: number
  p50Latency1m: number
  p90Latency1m: number
  p99Latency1m: number
  lastCalled: Date | null
}

class MetricsStore {
  private events: ExecutionEvent[] = []
  private windowMs = 60_000  // Fenêtre de 1 minute

  record(event: ExecutionEvent): void {
    this.events.push(event)
    this.cleanup()
  }

  getMetrics(name: string): FunctionMetrics {
    const now = Date.now()
    const window = this.events.filter(
      e => e.name === name && now - e.timestamp.getTime() < this.windowMs
    )
    const latencies = window.map(e => e.durationMs).sort((a, b) => a - b)

    return {
      invocations1m: window.length,
      errors1m: window.filter(e => e.status === "error").length,
      avgLatency1m: average(latencies),
      p50Latency1m: percentile(latencies, 50),
      p90Latency1m: percentile(latencies, 90),
      p99Latency1m: percentile(latencies, 99),
      lastCalled: window.length > 0 ? window[window.length - 1].timestamp : null,
    }
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs
    this.events = this.events.filter(e => e.timestamp.getTime() > cutoff)
  }
}
```

#### Frontend dashboard (SPA)

Une mini-app React servie par Hono. Structure :

```
src/aura/server/dashboard/
├── routes.ts           ← Routes API Hono
├── frontend/
│   ├── App.tsx         ← Root component
│   ├── pages/
│   │   ├── Logs.tsx    ← Logs temps réel
│   │   ├── Functions.tsx ← Liste + run function
│   │   ├── Errors.tsx  ← Error tracking
│   │   └── Metrics.tsx ← Graphiques
│   ├── hooks/
│   │   ├── useLogs.ts
│   │   ├── useMetrics.ts
│   │   └── useFunctions.ts
│   └── components/
│       ├── LogStream.tsx
│       ├── MetricChart.tsx
│       └── FunctionRunner.tsx
├── index.html
└── dashboard.tsx       ← Entrypoint build
```

Le build du dashboard peut être :
- Soit un `vite build` séparé (mini-app) — servie statiquement par Hono
- Soit un bundle inline dans le backend — plus simple

### 2.4 Dashboard MVP — Phase 1

```typescript
// Ce qu'on livre en premier
[Dashboard MVP]
├── Logs temps réel         ← WebSocket, voir les appels en direct
├── Erreurs                 ← Liste des erreurs avec stack trace
├── Run function            ← Input JSON, exécuter, voir résultat
└── Liste des functions     ← Nom, type, statut
```

Pas de graphiques dans le MVP. Pas de data browser. Pas de deployment history.

### 2.5 Dashboard — Phase 2

```
[Dashboard complet]
├── Logs temps réel           ✅
│   ├── Filtre par fonction
│   ├── Filtre par statut
│   └── Vue request ID
├── Erreurs                   ✅
│   ├── Stack trace
│   └── Fréquence / trending
├── Run function              ✅
│   ├── Input JSON éditeur
│   ├── Historique des runs
│   └── Résultat formaté
├── Metrics                   🆕
│   ├── Invocations/min
│   ├── Erreurs/min
│   ├── Latence (p50/p90/p99)
│   └── Graphiques temps réel
├── Functions list            ✅
│   └── Détail par fonction
└── Data browser              🆕
    ├── Tables
    ├── Documents
    └── Requêtes custom
```

---

## Thème 3 — Architecture Hono

### 3.1 Ce qui existe déjà

| Fichier | Fonction | Statut |
|---|---|---|
| `src/aura/server/hono-app.ts` | Factory qui monte toutes les routes Aura | ✅ Stable |
| `src/aura/server/routes/bridge.ts` | Route `/aura/rpc` pour les ops | ✅ |
| `src/aura/server/routes/internal.ts` | Route `/aura-internal` pour cron/triggers | ✅ |
| `src/aura/server/routes/files.ts` | Route `/files/*` pour uploads | ✅ |
| `src/aura/server/routes/health.ts` | Route `/health` | ✅ |
| `src/aura/server/routes/http-actions.ts` | Route `/aura-http/*` | ✅ |
| `src/aura/server/broadcast.ts` | Serveur WebSocket standalone | ✅ |
| `src/server.ts` | Entrypoint qui route Hono vs TanStack Start | ✅ |

### 3.2 Ce qui est à ajouter

```typescript
// src/aura/server/dashboard/routes.ts          — Routes API dashboard
// src/aura/server/observability/event-bus.ts    — Event bus pour logs/metrics
// src/aura/server/observability/metrics.ts      — Store de métriques
// src/aura/server/hono-app.ts (modifié)         — Ajouter dashboard routes
// src/server-hono.ts (nouveau)                  — Entrypoint backend standalone
```

### 3.3 Hono comme atout structurel

Hono est déjà le socle. Son avantage pour le split :

1. **Portable** — `app.fetch(request)` est une fonction pure. On peut l'appeler :
   - Dans un serveur Node (avec `@hono/node-server`)
   - Dans un worker Cloudflare
   - Dans le pipeline Vite/Nitro
   - Directement dans les tests (sans réseau)

2. **Testable** — `app.request("/aura/rpc", { method: "POST", body })` sans serveur

3. **Séparable** — La factory `createAuraHonoApp()` ne dépend pas de TanStack. On peut la sortir du build TanStack et en faire un artifact indépendant (c'est exactement ce qu'on fait dans le Thème 1).

---

## Thème 4 — Standardisation DX

**Détaillé dans PLAN.md.** Résumé :

### 4.1 Builder chainable (Phase 1)

- `defineAgent`, `defineDbReadFn`, `defineSearchIndex`, `defineVectorIndex` → builder
- Pattern : `defineX("name").optionA(...).optionB(...).handler(fn)`

### 4.2 Client DX (Phase 2)

`useAuraQuery(ref, { input })` → `useQuery(ref, flatArgs)`
`useAuraMutation(ref).mutate(args)` → `useMutation(ref)(args)` callable direct

### 4.3 Renommage

`useAuraQuery` → `useQuery`, `AuraClientProvider` → `AuraProvider`, etc.

---

## Roadmap

```
Semaine 1  : Thème 1 (Split) — server-hono.ts, package.json, RouteRules, Docker
Semaine 2  : Thème 2 (Dashboard) — event-bus, metrics, routes API MVP
Semaine 3  : Thème 2 (Dashboard) — frontend MVP (logs, run function, erreurs)
Semaine 4  : Thème 4 (DX Phase 1) — builders defineAgent, defineDbReadFn
Semaine 5  : Thème 4 (DX Phase 2) — client hooks
Semaine 6  : Thème 4 (DX Phase 3) — nettoyage, tests, déploiement
```

---

## Décisions en suspens

| Sujet | Options | À trancher |
|---|---|---|
| Build backend | tsup / esbuild / Bun build | Test technique |
| Proxy prod | RouteRules Nitro / nginx / Hono devant | **URGENT** |
| Dashboard frontend | React build séparé / Inline dans Hono | Priorité MVP |
| Dashboard tech | React / Preact / Vanilla | Priorité MVP |
| Déploiement | Docker Compose / Coolify / fly.io | Infra dispo |
