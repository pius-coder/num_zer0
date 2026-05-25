# Aura — Tracker d'Avancement

> Fichier source de vérité pour reprendre le travail après un reset de contexte.
> Chaque session lit ce fichier pour savoir exactement où on en est.

---

## Resume Session (lecture obligatoire après reset)

**Projet :** Aura — framework full-stack React/Hono/Prisma en monorepo Bun (pas pnpm, pas node).

**Structure :** `packages/aura/` = framework `@aura-js/core` (server, client, ui, core, cli) ; `apps/app/` = projet utilisateur `@aura-js/app`.

**Routing :** File-based avec `createFileRoute` dans `src/routes/`, `routeTree.gen.ts` généré par Vite. TanStack Start impose ça pour le SSR.

**Dernier commit :** `57b80bb` "theme 2: dashboard MVP (event-bus, metrics, API routes, SPA frontend)".

**Thème 4 terminé :**
- **Phase 1** — Tous les artefacts en builder chainable.
- **Phase 2** — Client DX : `useQuery`, `useMutation`, `AuraProvider`, etc. Anciens noms conservés comme alias.
- **Phase 3** — `ref/` supprimé, audit rewrite (barrel exports, stubs, types).
- **Phase 2 skip + tests** — pas commencé.

**Thème 2 commencé :**
- **Phase 1** — EventBus, MetricsStore, intégration runner, API REST `/dashboard/api/*`, SPA vanilla JS.

**Prochaine action :** soit Dashboard Phase 2 (graphiques metrics, filtres logs, historique des runs) soit Thème 3 (middleware stack Hono).

**Pièges connus :**
- `packages/aura/` importe `@/generated/prisma/client` (app-specific). Les tsconfig paths pointent vers `../../apps/app/src/generated/prisma/`.
- Les fichiers UI importent `#/aura/ui/*` (alias Vite configuré) et `@/lib/utils`, `@/components/*`, `@/hooks/*` (app-specific).
- `context-adapter.ts` (dans server/) importe `@tanstack/start-server-core` — ne pas inclure dans le barrel serveur si on veut un backend standalone.
- `packages/aura/package.json` a TOUTES les dépendances déclarées (plus de 30) — ne pas hésiter à en ajouter si manquantes, sinon Vite 8/Rolldown échoue.

**Fichiers clés :**
- `PLAN.md` = standardisation DX (builders, hooks) — Phase 1-3 complété
- `PLAN_THEMATIQUE.md` = split, dashboard, Hono (3 thèmes)
- `CHANGELOG.md` = log de chaque modif avec old/new motivation

---

## Architecture (source de vérité)

```
num_zer0/                                  ← Monorepo racine
├── Dockerfile.backend                    ← Build image backend Hono
├── Dockerfile.frontend                   ← Build image frontend TanStack Start
├── packages/
│   └── aura/                              ← Framework Aura (package réutilisable)
│       ├── src/
│       │   ├── server/                    ← Runtime serveur (Hono, ops, broadcast)
│       │   │   ├── routes/                ← Routes Hono (bridge, internal, files, health)
│       │   │   ├── middleware/             ← Middleware Hono
│       │   │   ├── ai/                    ← Agent AI
│       │   │   ├── auth/                  ← Auth
│       │   │   ├── transport/             ← Transport serveur
│       │   │   ├── storage/               ← File storage
│   │   │   ├── dashboard/             ← Dashboard MVP (routes, SPA frontend)
│   │   │   │   ├── routes.ts          ← API REST `/dashboard/api/*`
│   │   │   │   └── frontend/          ← Vanilla JS SPA (Logs, Functions, Errors, Metrics)
│   │   │   ├── observability/         ← EventBus + MetricsStore (in-memory)
│   │   │   │   ├── event-bus.ts       ← In-memory event bus (subscribers, ring buffer 1000)
│   │   │   │   └── metrics.ts         ← Per-function metrics (p50/p90/p99, fenêtre 1m)
│       │   │   ├── hono-app.ts            ← Factory Hono
│       │   │   ├── operation.ts           ← defineOperationFn
│       │   │   ├── agent.ts               ← defineAgent
│       │   │   ├── cron.ts                ← defineCronFn
│       │   │   ├── workflow.ts            ← defineWorkflow
│       │   │   ├── http-action.ts         ← defineHttpAction
│       │   │   ├── db-read.ts             ← defineDbReadFn
│       │   │   ├── search.ts              ← defineSearchIndex
│       │   │   ├── vector.ts              ← defineVectorIndex
│       │   │   ├── notification.ts        ← defineNotificationFn
│       │   │   ├── broadcast.ts           ← WebSocket broadcast
│       │   │   ├── entity-tracker.ts      ← Prisma entity tracking
│       │   │   ├── registry.ts            ← Registry des ops
│       │   │   ├── runner.ts              ← Runner d'opérations
│       │   │   ├── context.ts             ← Contexte d'exécution
│       │   │   ├── discovery.ts           ← Découverte d'artifacts
│       │   │   ├── scheduler.ts           ← Scheduler
│       │   │   ├── outbox.ts              ← Outbox pattern
│       │   │   ├── pagination.ts          ← Pagination
│       │   │   ├── invalidate.ts          ← Invalidation
│       │   │   ├── params.ts              ← Paramètres
│       │   │   ├── hydration.tsx          ← SSR hydration
│       │   │   ├── manifest-injector.tsx  ← Manifest injection
│       │   │   ├── index.ts               ← Exports publics (+ createAuraHonoApp)
│       │   │   └── ...
│       │   ├── client/                    ← Runtime client (React hooks)
│       │   │   ├── hooks.ts               ← useQuery, useMutation, useAction
│       │   │   ├── provider.tsx           ← AuraProvider
│       │   │   ├── transport.ts           ← Client transport
│       │   │   ├── paginated-query.ts     ← usePaginatedQuery
│       │   │   ├── form.ts                ← useAuraForm
│       │   │   ├── guard.tsx              ← AuraGuard
│       │   │   ├── params.ts              ← useAuraParams
│       │   │   ├── stepper.ts             ← useStepperForm
│       │   │   ├── hydration-boundary.tsx ← AuraHydrationBoundary
│       │   │   ├── agent.ts               ← useAuraAgent
│       │   │   ├── manifest-cache.ts      ← Client manifest cache
│       │   │   └── index.ts               ← Exports publics
│       │   ├── cli/                       ← CLI (make, codegen, doctor)
│       │   ├── core/                      ← Core types, errors, envelopes
│       │   ├── shared/                    ← Types partagés (manifest, schemas)
│       │   ├── ui/                        ← Composants shadcn (71 composants)
│       │   ├── test-utils/                ← Utilitaires de test
│       │   └── _generated/                ← Types générés (api.ts)
│       ├── prisma/                        ← Schéma Prisma aura
│       ├── aura.config.ts                 ← Config aura par défaut
│       ├── package.json                   ← @aura-js/core (dépendances complètes)
│       └── tsconfig.json
├── apps/
│   └── app/                              ← Projet utilisateur (num_zer0)
│       ├── src/
│       │   ├── routes/                   ← Routes TanStack (file-based, generate routeTree.gen.ts)
│       │   ├── components/               ← Composants spécifiques app
│       │   ├── lib/                      ← Utilitaires app
│       │   ├── hooks/                    ← Hooks app
│       │   ├── operations/               ← Operations Aura
│       │   │   ├── _registry.ts
│       │   │   ├── system/
│       │   │   ├── todos/
│       │   │   ├── ai/
│       │   │   └── catalog/
│       │   ├── server.ts                 ← Entrypoint TanStack Start (SSR)
│       │   ├── server-hono.ts            ← Entrypoint Hono standalone (backend)
│       │   ├── router.tsx                ← Router (importe routeTree.gen.ts)
│       │   ├── client.tsx                ← Client entry
│       │   ├── aura.registry.ts          ← Registry Aura
│       │   └── styles.css
│       ├── aura.config.ts
│       ├── components.json               ← shadcn config
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts                ← RouteRules, alias #/aura/, @/aura/, @/
│       ├── .env.production.example       ← Template variables prod
│       └── tailwind.config.ts
├── package.json                          ← Root workspace (Bun workspaces)
├── PLAN.md                               ← Plan DX standardisation
├── PLAN_THEMATIQUE.md                    ← Plan thématique (split, dashboard, hono)
├── CHANGELOG.md                          ← Log incrémental de chaque modification
├── TRACKER.md                            ← CE FICHIER — état d'avancement
├── AGENTS.md                             ← Instructions pour l'IA
├── .gitignore
└── README.md
```

---

## Todo list globale (référence toutes les parties du plan)

### Thème 1 — Split Déploiement (PLAN_THEMATIQUE.md §1)
- [x] Créer `server-hono.ts` — entrypoint Hono standalone ✅
- [x] Configurer `build:backend` (bun build) ✅
- [x] Configurer `build:frontend` (vite build) ✅
- [x] Ajouter RouteRules Nitro pour proxy en prod ✅
- [x] Créer Dockerfiles (backend + frontend) ✅
- [x] Configurer variables d'environnement (.env.production) ✅
- [x] Ajouter les dépendances manquantes à @aura-js/core ✅
- [ ] Tester le split complet (deux artifacts déployés) — à faire en déploiement réel

### Thème 2 — Dashboard (PLAN_THEMATIQUE.md §2)
- [ ] Créer EventBus (src/aura/server/observability/event-bus.ts)
- [ ] Créer MetricsStore (src/aura/server/observability/metrics.ts)
- [ ] Intégrer EventBus dans le runner d'opérations
- [ ] Créer routes API dashboard
- [ ] Créer WebSocket dashboard (/ws/dashboard)
- [ ] Créer frontend dashboard MVP (Logs, Run function, Erreurs)
- [ ] Phase 2: graphiques metrics

### Thème 3 — Hono (PLAN_THEMATIQUE.md §3)
- [x] Factory Hono (hono-app.ts) ✅
- [x] Routes bridge, internal, files, health, http-actions ✅
- [x] Broadcast WebSocket ✅
- [x] CORS middleware (global, hono/cors) ✅
- [x] Logger middleware (request/response logging) ✅
- [ ] Auth middleware (internal secret, api key)
- [x] Routes dashboard ✅ (Thème 2)

### Thème 4 — Standardisation DX (PLAN.md)
- [x] Phase 1: Builders — defineAgent, defineDbReadFn, defineSearchIndex, defineVectorIndex ✅
- [x] Phase 2: Client hooks — useQuery/useMutation callables, AuraProvider, args plats ✅
- [x] Phase 3: Nettoyage — suppression ref/ ✅

### Monorepo Migration
- [x] Phase 0: TRACKER.md + CHANGELOG.md ✅
- [x] Phase 1: Structure monorepo ✅
- [x] Phase 2: packages/aura ✅
- [x] Phase 3: apps/app ✅
- [x] Phase 4: Wiring + test ✅
- [x] Phase 5: Cleanup ✅

---

## État actuel

| Session | Action | Statut | Commit |
|---------|--------|--------|--------|
| 2026-05-24 | Phase 0: système tracking | ✅ | `3c495af` |
| 2026-05-24 | Phase 1-3: monorepo + migration framework + app | ✅ | `1550ab3` |
| 2026-05-24 | Phase 4: wiring + test dev server | ✅ | `93dfc0c` |
| 2026-05-24 | Phase 5: cleanup gitignore | ✅ | `2d46633` |
| 2026-05-24 | Thème 1: Split Déploiement | ✅ | `2958dc9` |
| 2026-05-24 | Thème 4: Standardisation DX (Phases 1-3) | ✅ | `62cb64d` |
| 2026-05-24 | Thème 4: Audit rewrite fixes | ✅ | `ff9c690` |
| 2026-05-24 | Thème 2: Dashboard MVP (Phase 1) | ✅ | `57b80bb` |
| 2026-05-24 | Thème 2: Dashboard MVP (Phase 2) | ✅ | `5773e68` |
| 2026-05-24 | AGENTS.md | ✅ | `c96ca81` |
| 2026-05-24 | Thème 3: Middleware stack Hono | ✅ | `1208606` |
| 2026-05-24 | Cleanup: Audit fixes (stepper, barrel, aliases, types, AGENTS.md) | ✅ | `0d00130` |
| 2026-05-24 | Cleanup: Re-audit final (bridge.ts any, doc comments, AGENTS.md) | ✅ | `c3e4393` |
| 2026-05-25 | Thème 3: auth middleware Hono (secret interne + api key) | 🚧 | *(courant)* |

## Prochaine action

- [x] Dashboard Phase 2: Graphiques metrics (Chart.js), vue request ID, JSON éditeur, run history, détail fonction, error trending ✅
- [x] Thème 3: Middleware stack Hono (cors, logging) ✅
- [x] Thème 3: Auth middleware (internal secret, api key) ✅

---

## Décisions d'architecture (contraignantes)

| # | Décision | Raison |
| D1 | ~~Monorepo pnpm workspaces~~ → **DEPRECATED** Utiliser Bun workspaces | `bun` est le runtime unique, pas besoin de pnpm. `bun install` + `bun build` remplacent pnpm et tsup. Déduplication automatique dans le monorepo. |
| D2 | ~~Routes code-based (pas file-based)~~ → **DEPRECATED** Utiliser file-based avec routeTree.gen.ts | TanStack Start nécessite la génération du route tree pour le SSR bundling. Les routes sont en `src/routes/` avec `createFileRoute`. La génération est automatique via le plugin Vite. |
| D3 | Aura est un workspace package (pas npm publish) | Dev local, pas de registre |
| D4 | Hono est le socle HTTP | Portable, standard Web, déjà existant |
| D5 | Dashboard = SPA servie par Hono | Indépendant du frontend principal |
| D6 | EventBus in-memory (pas de DB) | Assez pour MVP, pas de surcharge |
| D7 | Dashboard frontend = vanilla JS (pas React build séparé) | MVP : zéro build step, servie directement par Hono. React sera ajouté si le dashboard devient complexe. ~~Mini-app React build séparé~~ → **DEPRECATED** |

---

## Conventions

- Chaque phase = 1 commit signé
- Message de commit: `phase: <num> - <description>`
- CHANGELOG.md mis à jour à chaque phase
- TRACKER.md mis à jour à chaque changement de statut
- Ne JAMAIS supprimer une décision — la marquer comme `DEPRECATED` avec la nouvelle motivation
