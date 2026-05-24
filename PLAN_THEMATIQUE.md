# Plan Aura — Architecture par Thèmes

> Ce plan complète PLAN.md. Chaque thème est indépendant, classé par priorité d'investigation.

---

## Thème 1 — Analyse du Split Déploiement (Dev mono-package / Prod séparé)

### 1.1 Contexte

- **Dev** : tout dans un seul package, un seul `npm run dev` — Hono + TanStack Start tournent dans le même process
- **Prod** : on veut déployer le backend (Hono API + WebSocket) et le frontend (TanStack Start SSR) séparément, sur des infrastructures potentiellement différentes
- **Pas de monorepo** : on garde un seul package, pas de workspaces ni d'apps/ séparées
- **Pas de codegen** : trop complexe à maintenir, on veut une solution sans génération

### 1.2 Comment Convex gère le split

Convex a un modèle très différent du nôtre car c'est un BaaS :

| Environnement | Architecture | Stockage |
|---|---|---|
| Dev local | Binaire unique `local_backend` (Rust) — tourne tout dans un seul process | SQLite |
| Prod cloud | Backend distribué (plusieurs microservices) | PostgreSQL + S3 |

La clé : **la même API publique** (`public_api`) est exposée dans les deux environnements. Le client Convex (`convex/react`) ne fait jamais la différence — il appelle toujours le même endpoint HTTP/WebSocket, que ce soit `localhost:3210` ou `my-project.convex.cloud`.

**Ce qu'on peut en retenir :**
- Notre API Aura (Hono) doit être une abstraction stable, identique en dev et en prod
- Le client Aura ne doit pas savoir s'il parle au backend local ou distant
- En dev, tout tourne dans un seul process — en prod, le backend Hono est un service indépendant

### 1.3 Comment les autres stacks gèrent le split

Recherche sur les patterns Hono + TanStack Start / frameworks full-stack :

#### Approche A : "Hono in the back" (proxy TanStack Start → Hono)

```
                         ┌──────────────────┐
                         │   TanStack Start  │
                         │   (SSR + Router)  │
                         │                   │
  Request ──────────────►│  /api/* → Hono    │
                         │  /*     → React   │
                         └────────┬─────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │   Hono Server  │
                          │   (API + WS)   │
                          └───────────────┘
```

Pattern utilisé par `scttcper/hono-tanstack-start`, `uncvrd/tanstack-start-hono`, `isnifer/tanstack-start-ssr-hono`.

En dev : TanStack Start (Vite) proxy `/api/*` vers Hono via une route wildcard `src/routes/api/$.ts`.
En prod : soit on déploie ensemble (un seul artifact Nitro), soit on split.

**Avantage** : Hono est "in the back" — on peut le remplacer, le sortir, le déployer séparément sans toucher au frontend.
**Inconvénient** : le proxy ajoute un saut réseau meme en dev.

#### Approche B : "Hono up front" (single entrypoint)

```
                         ┌──────────────────────┐
                         │   Hono Server (entry) │
                         │                       │
  Request ──────────────►│  /api/* → Hono route  │
                         │  /*     → TanStack SS │
                         └──────────────────────┘
```

Pattern de `bskimball/tanstack-hono`. Un seul `server.ts` qui route :

```typescript
// server.ts — entrypoint unique
const app = new Hono()

// API routes
app.route("/api", apiRoutes)

// SSR — tout le reste va vers TanStack Router
app.all("*", async (c) => {
  return renderTanStackStart(c.req.raw)
})
```

En dev : Hono Dev Server + Vite. En prod : build Hono seul (backend), build TanStack Start seul (frontend).

**Avantage** : architecture claire, Hono est le vrai point d'entrée.
**Inconvénient** : plus de config build (deux builds séparés en prod).

#### Approche C : RouteRules Nitro (proxy natif TanStack Start)

TanStack Start utilise Nitro sous le capot. Nitro expose les `routeRules` :

```typescript
// app.config.ts
export default defineConfig({
  server: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:4000' },
    },
  },
})
```

En dev : Nitro proxy `/api/*` vers Hono. En prod : chaque déploiement définit ses propres routeRules (ou on split carrément).

**Avantage** : zéro code de proxy, config déclarative.
**Inconvénient** : feature encore jeune, pas encore assez documentée pour une utilisation en production sereine.

### 1.4 Notre approche retenue

**Phase DEV (mono-package)** : Approche B simplifiée — Hono up front mais on ne split pas les builds.

```typescript
// src/server.ts (dev)
const app = new Hono()

// Routes API Aura
app.route("/api/aura", auraApiRoutes)

// WebSocket Aura
app.get("/ws/aura", (c) => handleWebSocket(c))

// TanStack Start SSR
app.all("*", async (c) => {
  return renderTanStackStart(c.req.raw)
})

export default app
```

Un seul serveur Hono, un seul process, un seul `npm run dev`.

**Phase PROD (split)** : deux artifacts, un seul package.

```
Package unique (src/)
├── build/backend/    ← build séparé (Hono seul)
└── build/frontend/   ← build séparé (TanStack Start)
```

Stratégie de build :

```json
{
  "scripts": {
    "dev": "vite",
    "build:backend": "tsc && ... bundle Hono seul",
    "build:frontend": "vite build  # TanStack Start build",
    "build": "npm run build:backend && npm run build:frontend",
    "start": "NODE_ENV=production node build/backend/server.js"
  }
}
```

Le déploiement en prod :
- **Backend** : Hono API + WebSocket, déployé sur un serveur (Node/Bun/Docker)
- **Frontend** : TanStack Start (build statique + SSR si besoin), déployé séparément
- **Communication** : le frontend appelle `API_URL` (variable d'env pointant vers le backend)

**Pas de codegen.** Le client Aura utilise une variable d'environnement pour l'URL du backend.

```
// Client
export const aura = createAuraClient({
  url: import.meta.env.VITE_AURA_URL ?? "http://localhost:3000/api/aura",
})
```

### 1.5 Ce qui reste à résoudre

| Problème | Option 1 | Option 2 | Décision |
|---|---|---|---|
| Build backend séparé | tsup bundler | Bun build | À tester |
| WebSocket en prod | Même serveur Hono | Serveur WS dédié | À décider |
| Partage des types backend/frontend | Les types sont dans le même package | — | Déjà résolu |
| Session/auth partagée | JWT stateless | Cookie + proxy | À décider |
| Déploiement | Docker Compose | Coolify | À décider |

---

## Thème 2 — Architecture Hono

### 2.1 Rôle de Hono dans Aura

Hono est **le socle HTTP d'Aura**. Il gère :

- Le **routing** : toutes les requêtes entrent par Hono
- Les **WebSockets** : connexions temps réel pour les subscriptions (déjà implémenté dans `broadcast.ts`)
- Les **middlewares** : auth, CORS, rate limiting
- Les **endpoints d'administration** : dashboard, health check, metrics
- La **séparation backend/frontend** : Hono est la couche qui rend le split possible

### 2.2 Ce qui existe déjà

| Fichier | Fonction | Statut |
|---|---|---|
| `src/aura/server/broadcast.ts` | Serveur WebSocket broadcast | ✅ Fonctionnel |
| `src/aura/server/http-action.ts` | `defineHttpAction` | ✅ Builder chainable |
| Opérations | `/api/aura/*` | ✅ Routing via le handler Aura |

### 2.3 Ce qui est à construire

#### a) Routes d'infrastructure

```typescript
// src/aura/server/hono/routes/infra.ts
// Health check, metrics, readyz
router.get("/aura/health", healthHandler)
router.get("/aura/readyz", readyzHandler)
router.get("/aura/metrics", metricsHandler)
```

#### b) Route Aura universelle

```typescript
// src/aura/server/hono/routes/aura.ts
// Point d'entrée unique pour toutes les opérations Aura
// POST /aura/rpc — exécute une opération (query/mutation/action)
// POST /aura/rpc/stream — subscription WebSocket
router.post("/aura/rpc", auraRpcHandler)
```

#### c) Middleware stack

```typescript
// src/aura/server/hono/middleware/
// auth.ts, cors.ts, rate-limit.ts, logging.ts
```

#### d) Entrypoint unique

```typescript
// src/aura/server/hono/app.ts
// Assemble tout : routes infra + routes aura + TanStack Start SSR fallback
```

### 2.4 Avantage concurrentiel de Hono

- **Léger** : ~20KB, zéro dépendance lourde
- **Standards Web** : `Request`/`Response`, compatible Edge, Deno, Bun, Node
- **RPC natif** : `hc` client généré, mais on garde notre propre client Aura
- **Middleware riche** : déjà mûr, validation Zod incluse
- **WebSocket intégré** : pas besoin de ws ou socket.io
- **Portable** : on peut déployer sur Node, Bun, Cloudflare Workers, Deno sans changer le code

---

## Thème 3 — Dashboard (Observabilité)

### 3.1 Ce que fait le dashboard Convex

Le dashboard Convex propose :

| Fonctionnalité | Description |
|---|---|
| **Data Explorer** | Naviguer dans la DB, voir les documents, éditer |
| **Functions** | Voir toutes les queries/mutations/actions, les logs d'exécution |
| **Logs** | Logs temps réel de toutes les exécutions |
| **Metrics** | Latence, nombre d'appels, erreurs |
| **Schema** | Visualisation du schéma de données |
| **Scheduling** | Voir les cron jobs, tâches planifiées |
| **File Storage** | Upload/download de fichiers |
| **Tunnel** | Exposition du localhost pour tests webhooks |
| **Deployments** | Historique des déploiements |

### 3.2 Notre dashboard Aura — MVP

On ne copie pas Convex, on fait le strict nécessaire pour le debug et l'observabilité :

#### MVP (Phase 1)

```
/dashboard/
├── operations     # Liste des opérations, statut, logs d'appels
├── agents         # Voir les agents, leur configuration
├── logs           # Logs en temps réel (WebSocket)
├── entities       # Voir les entités enregistrées (entity-tracker)
└── health         # Health check + uptime
```

#### Architecture dashboard

Le dashboard est une **TanStack App** montée dans Hono :

```typescript
// Route Hono pour le dashboard
router.get("/dashboard/*", async (c) => {
  // Soit render une TanStack App séparée
  // Soit servir des templates HTML simples
})
```

Deux options :

**Option A : Dashboard intégré au frontend principal**
- Les pages dashboard sont des routes TanStack Router protégées
- Avantage : une seule app, UI cohérente
- Inconvénient : le dashboard est lié au cycle de vie du frontend

**Option B : Dashboard standalone (monté dans Hono)**
- Une mini-app React servie par Hono sur `/dashboard/*`
- Avantage : fonctionne même si le frontend principal est down
- Inconvénient : deux apps React à maintenir

**Décision** : commencer par l'Option B — le dashboard est un outil d'infrastructure, il doit être indépendant du frontend utilisateur.

#### Implémentation MVP

```typescript
// src/aura/server/dashboard/dashboard.ts
// Routes Hono pour le dashboard
router.get("/dashboard/api/operations", listOperations)
router.get("/dashboard/api/logs", streamLogsSSE)
router.get("/dashboard/api/entities", listEntities)
router.get("/dashboard/api/health", healthStatus)

// Pages
router.get("/dashboard", serveDashboardHTML)
router.get("/dashboard/*", serveDashboardAssets)
```

Le frontend du dashboard peut être :
- React minimal (Preact?) monté dans `/dashboard/*`
- Ou même vanilla HTML/JS pour le MVP
- Évoluer vers React quand le besoin s'en fait sentir

#### Logs en temps réel

Déjà implémenté en partie via WebSocket broadcast :

```typescript
// Réutiliser broadcast.ts pour streamer les logs vers le dashboard
broadcaster.subscribe("dashboard", (log) => {
  ws.send(JSON.stringify(log))
})
```

### 3.3 Données exposées par le dashboard

```typescript
// Types pour le dashboard
interface DashboardOperation {
  name: string
  type: "query" | "mutation" | "action"
  calls: number
  avgLatency: number
  errorRate: number
  lastCalled: Date
}

interface DashboardLog {
  id: string
  operation: string
  timestamp: Date
  duration: number
  status: "success" | "error"
  error?: string
}

interface DashboardEntity {
  name: string
  count: number
  tracked: boolean
}
```

---

## Thème 4 — Standardisation DX

**Ce thème est détaillé dans PLAN.md.** Voici un résumé des décisions :

### 4.1 Builder chainable (Phase 1)

- `defineAgent`, `defineDbReadFn`, `defineSearchIndex`, `defineVectorIndex` passent d'objet config → builder chainable
- `defineOperationFn`, `defineHttpAction`, `defineWorkflow`, `defineCronFn`, `defineNotificationFn`, `defineCommonFn` restent inchangés (déjà builders)
- Pattern : `defineX("name").optionA(...).optionB(...).handler(fn)`

### 4.2 Client DX (Phase 2)

| Avant | Après |
|---|---|
| `useAuraQuery(ref, { input })` | `useQuery(ref, flatArgs)` |
| `useAuraMutation(ref).mutate(args)` | `useMutation(ref)(args)` callable direct |
| `useAuraPaginatedQuery(ref, { input })` | `usePaginatedQuery(ref, flatArgs)` |
| `{ data, isLoading }` | `data === undefined` pour loading |
| Pas de skip | `"skip"` pour désactiver |
| `AuraClientProvider` | `AuraProvider` |

### 4.3 Renommage des exports

| Ancien | Nouveau |
|---|---|
| `useAuraQuery` | `useQuery` |
| `useAuraMutation` | `useMutation` |
| `useAuraPaginatedQuery` | `usePaginatedQuery` |
| `AuraClientProvider` | `AuraProvider` |

### 4.4 Nettoyage (Phase 3)

- Supprimer les anciens exports
- Mettre à jour les fichiers utilisateurs

---

## Roadmap par Thème

```
Semaine 1-2 : Thème 1 (Split Déploiement) — Décisions finales + scripts de build
              Thème 2 (Hono) — Middleware stack, routes infra, entrypoint

Semaine 3-4 : Thème 4 (DX) — Phase 1 (builders) + Phase 2 (client hooks)

Semaine 5   : Thème 3 (Dashboard) — MVP dashboard standalone

Semaine 6   : Thème 4 (DX) — Phase 3 (nettoyage) + tests
              Thème 1 (Split) — Build prod, Docker, déploiement
```

---

## Décisions en suspens (à trancher)

| Sujet | Options | À décider par |
|---|---|---|
| Build backend séparé | tsup / esbuild / Bun build / vite lib mode | Test technique |
| Dashboard tech | React monté dans Hono / Vanilla HTML/JS | Priorité MVP |
| Déploiement prod | Docker Compose / Coolify / fly.io / Railway | Infrastructure dispo |
| Auth inter-services | JWT stateless / Cookie partagé / API Key | Architecture |
| WebSocket prod | Même serveur Hono / Serveur dédié | Charge estimée |
