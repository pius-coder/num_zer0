# Plan Thématique — Restructuration Aura

> Ce plan détaille les thèmes de la restructuration. L'ordre d'exécution est dans PLAN.md.
> Chaque thème est indépendant et peut être réalisé en parallèle une fois les contrats stables (Phase 0).

---

## Thème A — Core Runtime & Contrats

**Objectif :** Définir et implémenter le noyau minimal d'Aura.

### Contrats
- `AuraPlugin` — interface que tout plugin doit implémenter
- `AuraRuntime` — orchestrateur qui charge les plugins et expose leurs capacités
- `AuraContext` — contexte de requête minimal, extensible par plugins
- `AuraOperation` — opération Query/Mutate/Action avec builder chainable
- `AuraError` / `AuraEnvelope` — contrat d'erreur et de réponse
- `AuraManifest` — manifeste client généré depuis le registry
- `AuraConfig` — configuration de l'app + plugins

### Packages
| Package | Contenu |
|---------|---------|
| `@aura/core` | Runtime, Registry, Plugin host, Operation builder, Errors, Config, Manifest |

### Dépendances autorisées
- `zod` (validation)
- `uuid` (identifiants)
- Aucune autre dépendance runtime

### Fichiers supprimés de l'ancien core
- `packages/aura/src/server/create-context.ts`
- `packages/aura/src/server/context.ts`
- `packages/aura/src/server/registry.ts` (réécrit)
- `packages/aura/src/server/runner.ts` (réécrit)
- `packages/aura/src/server/operation.ts` (déplacé)
- `packages/aura/src/server/errors.ts` (déplacé)
- `packages/aura/src/server/envelope.ts` (déplacé)
- `packages/aura/src/server/discovery.ts` (réécrit)
- `packages/aura/src/server/index.ts` (supprimé)

---

## Thème B — Adapters

**Objectif :** Chaque technologie externe (Hono, Prisma, React) devient un adapter optionnel.

### B.1 — `@aura/server-hono`
- Factory `createHonoApp(runtime: AuraRuntime): Hono`
- Monte les routes depuis `runtime.plugins`
- Bridge transport standard
- Middleware : CORS, CSRF, rate-limit, logger
- Peut fonctionner sans Prisma, sans React, sans dashboard

### B.2 — `@aura/prisma`
- Injecte `PrismaClient` dans le runtime
- Helper `createPrismaAdapter(config)` → plugin Aura
- Pagination cursor (actuellement dans le core)
- Entity tracker (actuellement dans le core)
- Système de migrations plugins :
  ```ts
  plugin.migrations.register("./prisma/migrations")
  ```
  Le adapter collecte et exécute les migrations de tous les plugins actifs.

### B.3 — `@aura/client-react`
- `useQuery(ref, input, opts?)` — TanStack Query wrapper
- `useMutation(ref, opts?)` — callable directe
- `AuraProvider` — contexte React
- `AuraHydrationBoundary` — SSR TanStack Start
- `usePaginatedQuery`, `useStepperForm`, `useAuraForm`, `useAuraParams`
- Hooks agent : `useAgentThread`, `useAgentStream`, `useAgentSend`

---

## Thème C — Plugins Officiels

**Objectif :** Chaque feature devient un plugin indépendant, installable via config.

### C.1 — Auth (`@aura/auth`)
- Sessions (cookie-based)
- Password (bcrypt)
- OTP (email/phone)
- OAuth providers (Google, GitHub, etc.)
- Permissions système
- Peut être activé/désactivé

### C.2 — Storage (`@aura/storage`)
- Drivers : filesystem, S3, R2
- Interface `AuraStorage` (inchangée)
- `ctx.capabilities.storage.upload()`, `.delete()`, `.store()`, `.getUrl()`

### C.3 — Cron (`@aura/cron`)
- Déclaration : `defineCronFn("name").schedule("* * * * *").handler(fn)`
- Registry cron jobs
- Execution via `runAuraCron(name)`
- Historique dans `AuraJobRun`

### C.4 — Workflows (`@aura/workflows`)
- Déclaration : `defineWorkflow("name").handler(fn)`
- Step/Sleep persistence
- Resume après crash
- Scheduler intégré

### C.5 — HTTP Actions (`@aura/http-actions`)
- Webhook-style handlers
- Access control : public, auth, internal
- CSRF optionnel

### C.6 — Realtime (`@aura/realtime`)
- WebSocket server
- Broadcast / fanout
- Invalidation temps réel
- Signature HMAC

### C.7 — Observability (`@aura/observability`)
- `EventBus` in-memory
- `MetricsStore` (p50/p90/p99)
- Logging
- Export vers Axiom/Datadog/Sentry
- Souscrit aux événements du runtime

### C.8 — Dashboard (`@aura/dashboard`)
- SPA servie par le backend
- API d'introspection via le runtime (pas d'accès direct au registry)
- Logs, metrics, run function, erreurs
- Chart.js pour les graphiques
- Indépendant du frontend principal

### C.9 — AI (`@aura/ai`)
- Provider LangChain (extensible)
- `defineAgent`, `generateText`, `streamText`
- Thread persistence, tool calling, approval workflow
- Usage tracking

### C.10 — Search Postgres (`@aura/search-postgres`)
- Full-text search via Postgres FTS
- `defineSearchIndex`, `search()`
- Génération SQL

### C.11 — Vector pgvector (`@aura/vector-pgvector`)
- Similarité vectorielle via pgvector
- `defineVectorIndex`, `vectorSearch()`
- Génération SQL

### C.12 — Pagination (`@aura/pagination-prisma`)
- Cursor encoding/décoding
- Helper paginate pour Prisma

---

## Thème D — CLI & Outillage

**Objectif :** CLI extensible par plugins.

### `@aura/cli`
- `aura init` — setup project
- `aura dev` — run avec plugins
- `aura build` — build core + plugins sélectionnés
- `aura generate` — codegen registry
- `aura make` — stubs (extensible via `plugin.cli.registerGenerator`)
- `aura doctor` — validate config
- `aura plugin:list` / `plugin:add` / `plugin:remove`

### Découverte
- Remplacer `discovery.ts` dur par un système où chaque plugin déclare ses suffixes
- Le CLI génère `_registry.ts` en Important de la config + plugins
- Les plugins communautaires peuvent ajouter leurs propres types d'artefacts

---

## Thème E — Architecture Cible Finale

```
num_zer0/
├── packages/
│   ├── core/                 ← @aura/core (runtime + contrats)
│   ├── server-hono/          ← @aura/server-hono (adapter HTTP)
│   ├── client-react/         ← @aura/client-react (adapter frontend)
│   ├── prisma/               ← @aura/prisma (adapter DB)
│   ├── cli/                  ← @aura/cli (outillage)
│   ├── ui/                   ← @aura/ui (composants optionnels)
│   └── plugins/
│       ├── auth/             ← @aura/auth
│       ├── storage/          ← @aura/storage
│       ├── cron/             ← @aura/cron
│       ├── workflows/        ← @aura/workflows
│       ├── http-actions/     ← @aura/http-actions
│       ├── realtime/         ← @aura/realtime
│       ├── observability/    ← @aura/observability
│       ├── dashboard/        ← @aura/dashboard
│       ├── ai/               ← @aura/ai
│       ├── search-postgres/  ← @aura/search-postgres
│       ├── vector-pgvector/  ← @aura/vector-pgvector
│       └── pagination-prisma/← @aura/pagination-prisma
├── apps/
│   └── app/                  ← Projet utilisateur
│       ├── aura.config.ts    ← Sélectionne les plugins
│       └── src/
│           ├── operations/   ← Ops utilisateur (indépendantes du core)
│           └── routes/       ← Routes TanStack
├── PROMPT.md                 ← Prompt architecte original
├── PLAN.md                   ← Plan d'exécution (ce fichier)
├── PLAN_THEMATIQUE.md        ← Thèmes détaillés
├── TRACKER.md                ← État d'avancement
├── audit.md                  ← Audit architectural
└── CHANGELOG.md              ← Log des modifications
```
