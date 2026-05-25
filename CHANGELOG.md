# Aura — Changelog

> Log incrémental de toutes les modifications.
> Format: `YYYY-MM-DD | Phase N | [Ajouté/Modifié/Supprimé/Déprécié]`

---

## 2026-05-24 | Phase 0 | Ajouté

**Système de tracking pour reprise de contexte**

- `TRACKER.md` — Fichier source de vérité. Contient l'architecture complète, todo list, état d'avancement, décisions contraignantes, et prochaine action.
- `CHANGELOG.md` — CE FICHIER. Log incrémental de chaque modification avec l'ancienne motivation vs nouvelle motivation.

**Motivation initiale :**
> Le contexte de l'IA se réinitialise à chaque session. Impossible de travailler sur un projet complexe sans un fichier qui stocke l'état exact et les décisions. TRACKER.md sert de "mémoire externe".

---

## 2026-05-24 | Phase 1-3 | Ajouté/Modifié

**Migration monorepo complète : structure + framework + app**

- `package.json` racine avec workspaces bun, `.gitignore`, `tsconfig.base.json`
- `packages/aura/` — package `@aura-js/core` avec exports server/client/ui/shared/core/cli
- `apps/app/` — package `@aura-js/app` avec l'application utilisateur
- Migration du framework : `src/aura/*` → `packages/aura/src/*`
- Migration de l'app : `ref/aura_stack/src/*` → `apps/app/src/*`
- `_generated/` gardé dans l'app car spécifique au projet
- `vite.config.ts` avec alias regex : `@/aura/_generated/*` → local, sinon `@/aura/*` → package

## 2026-05-24 | Phase 4 | Modifié

**Routes file-based (compatibilité TanStack Start)**

- Retour aux routes file-based car TanStack Start nécessite la génération du route tree pour le SSR
- `src/routes/` avec `createFileRoute` — layout, home, about, todos
- `router.tsx` importe depuis `routeTree.gen.ts`
- `routeTree.gen.ts` ajouté au `.gitignore`

**Ancienne motivation (code-based) :**
> `createRoute()` dans `router.tsx` — contrôle total, pas de génération.

**Nouvelle motivation (file-based) :**
> TanStack Start a besoin du route tree généré pour le SSR bundling. Les routes sont en `src/routes/` avec `createFileRoute`. La génération est automatique via le plugin Vite. Le `router.tsx` importe le tree généré. C'est la seule manière supportée par Start aujourd'hui.

---

## 2026-05-24 | Split Déploiement (Thème 1) | Ajouté/Modifié

**Deux artifacts : backend Hono standalone + frontend TanStack Start**

- `apps/app/src/server-hono.ts` — Entrypoint Hono standalone pour la prod
- `apps/app/vite.config.ts` — RouteRules Nitro pour proxy /aura/* → backend
- `apps/app/package.json` — Scripts `build:backend` (bun build), `dev:backend`, `start:backend`
- `apps/app/.env.production` — Variables d'env pour la prod
- `Dockerfile.backend` + `Dockerfile.frontend` — Images Docker pour chaque artifact
- `packages/aura/package.json` — Ajout de toutes les dépendances manquantes (uuid, base-ui, langchain, hookform, hugeicons, cva, cmdk, vaul, recharts, resizable-panels, tanstack/react-router, vite)
- `packages/aura/tsconfig.json` — Ajout des paths `@/aura/*` → `./src/` et `@/generated/prisma/*`
- `tsconfig.base.json` — Correction des paths `@aura-js/core/*` et ajout `@/aura/*`
- `packages/aura/src/server/index.ts` — Export de `createAuraHonoApp`
- `apps/app/vite.config.ts` — Ajout alias `#/aura/` → package aura

**Résultat :**
- `bun run build:backend` → `build/backend/server-hono.js` (8.1 MB) ✅
- `bun run build:frontend` → `.output/` (client + ssr) ✅
- `bun src/server-hono.ts` → serveur Hono standalone sur :3001 ✅
- `bun dev` → serveur de dev unifié (TanStack + Hono) ✅

---

## 2026-05-24 | Brain Update 1 | Modifié

**Mise à jour post-session des fichiers de tracking**

- `TRACKER.md` — Architecture: ajout Dockerfiles, server-hono.ts, .env.production.example ; root passe de pnpm à Bun workspaces ; suppression pnpm-workspace.yaml ; router passe de code-based à file-based
- `TRACKER.md` — Décisions D1 et D2 marquées **DEPRECATED** avec nouvelle motivation conservée
- `TRACKER.md` — Table État actuel: commit `2958dc9` pour Thème 1

**Ancienne décision D1 :**
> Monorepo pnpm workspaces — Léger, natif, pas de dépendance build.

**Nouvelle motivation D1 :**
> `bun` est le runtime unique, pas besoin de pnpm. `bun install` + `bun build` remplacent pnpm et tsup. Déduplication automatique dans le monorepo.

**Ancienne décision D2 :**
> Routes code-based — Choix utilisateur, contrôle total.

**Nouvelle motivation D2 :**
> TanStack Start nécessite la génération du route tree pour le SSR bundling. Routes en `src/routes/` avec `createFileRoute`. Génération automatique via le plugin Vite.

---

## 2026-05-24 | Thème 4 (DX) — Phase 1-3 | Ajouté/Modifié/Supprimé

**Standardisation complète de la DX client + serveur (builder chainable partout)**

### Phase 1 — Builders (4 artefacts migrés)

- `defineDbReadFn("name").input(z).output(z).handler(fn)` — `packages/aura/src/server/db-read.ts`
- `defineSearchIndex("Model").fields(f).filterFields(ff).language(l).handler(fn)` — `packages/aura/src/server/search.ts`
- `defineVectorIndex("Model").vectorField(v).dimensions(d).filterFields(ff).indexType(t).handler(fn)` — `packages/aura/src/server/vector.ts`
- `defineAgent("name").model(m).systemPrompt(s).tools(t).maxSteps(n).rag(r).handler(fn)` — `packages/aura/src/server/ai/agent.ts`
- CLI `make.ts` : tous les stubs génèrent le nouveau pattern builder
- Tests `search-vector.test.ts` : mis à jour pour le nouveau builder
- `todo-planner.agent.ts` : migré vers le builder

### Phase 2 — Client DX (hooks renommés + nouvelle API)

- `useAuraQuery(ref, { input, ... })` → `useQuery(ref, flatInput, options?)` (args plats)
- `useAuraMutation(ref, opts)` → `useMutation(ref, opts?)` callable directe avec `.mutate`/`.isPending`
- `AuraClientProvider` → `AuraProvider` (alias conservé)
- `configureAuraClient` → `configureAura` (alias)
- `callAuraOperation` → `callAura` (alias)
- `fetchAuraManifest` → `fetchManifest` (alias)
- `useAuraBroadcast` → `useBroadcast` (alias)
- `useAuraPaginatedQuery` → `usePaginatedQuery` (alias)
- `useAuraAgentThread/Stream/Send` → `useAgentThread/Stream/Send` (alias)
- Barrel `packages/aura/src/client/index.ts` : exports les deux (ancien + nouveau nom)
- `packages/aura/src/client/hooks.ts` : `UseQueryOptions_`/`UseMutationOptions_` remplace `UseAuraQueryOptions`/`UseAuraMutationOptions`
- `form.ts`/`stepper.ts`/`guard.tsx` : imports mis à jour pour les nouveaux types
- App (`__root.tsx`, `index.tsx`, `todos.tsx`) : imports et appels mis à jour

### Phase 3 — Nettoyage

- `ref/` dossier supprimé (ancienne structure obsolète)

### Audit Rewrite — Incompatibilités corrigées

**CRITICAL :**
- `server/index.ts` : ajout de 15+ exports manquants (`defineAgent`, `defineOperationFn`, `defineCronFn`, etc.)
- `cli/make.ts` : `makeSearch`/`makeVector` génèrent `search()`/`vectorSearch()` (standalone) au lieu de `ctx.*()` qui n'existe pas
- `cli/make.ts` : `makeAgent` ne génère plus `.model(null as any)` qui plantait à l'enregistrement
- Tous les stubs CLI importent maintenant depuis `@/aura/server` (barrel) au lieu de chemins internes

**HIGH :**
- `server/manifest-injector.tsx` : réécrit avec `AuraProvider` au lieu de `AuraClientProvider`
- `server/ai/agent.ts` : `DefineAgentOptions` supprimé (dead code) ; `AgentDefinition` étend `AgentRef`
- `client/provider.tsx` : imports internes → `configureAura`/`fetchManifest`
- `client/hooks.ts` : import interne → `fetchManifest`
- `client/form.ts`, `client/stepper.ts` : imports internes → `useMutation`
- 5 composants UI : imports réécrits vers les nouveaux noms (`useMutation`, `usePaginatedQuery`, `useAgentThread`, etc.)

**LOW :**
- Commentaires stalés dans `codegen.ts`, `api.ts`, `query-key.ts`, `runner.ts` mis à jour
- `AuraProviderProps` type alias ajouté
- `callAuraOperationWithMeta` exporté du barrel

### Ancienne API conservée :
Tous les anciens noms (`useAuraQuery`, `AuraClientProvider`, etc.) existent encore comme alias. Les composants UI qui les importent continuent de fonctionner sans changement.

---

## 2026-05-24 | Thème 2 — Dashboard MVP (Phase 1) | Ajouté/Modifié

**CRÉÉ :**
- `packages/aura/src/server/observability/event-bus.ts` — EventBus in-memory (subscribers, ring buffer 1000 events)
- `packages/aura/src/server/observability/metrics.ts` — MetricsStore (p50/p90/p99, fenêtre 1m, par function)
- `packages/aura/src/server/dashboard/routes.ts` — Routes API dashboard :
  - `GET /dashboard/api/functions` — Liste + metrics
  - `GET /dashboard/api/functions/:name` — Détail + logs
  - `POST /dashboard/api/functions/:name/run` — Exécuter une op
  - `GET /dashboard/api/logs` — Logs récents (filtre name/status)
  - `GET /dashboard/api/errors` — Erreurs récentes
  - `GET /dashboard/api/metrics` — Toutes les métriques agrégées
- `packages/aura/src/server/dashboard/frontend/index.html` — SPA vanilla JS (Logs, Functions, Errors, Metrics)

**MODIFIÉ :**
- `packages/aura/src/server/runner.ts` — Capture `console.log/warn/error/debug` + émission EventBus + MetricsStore
- `packages/aura/src/server/hono-app.ts` — Montage de `/dashboard` dans `createAuraHonoApp()`
- `packages/aura/src/server/index.ts` — Exports `eventBus`, `metricsStore`, `auraDashboardRouter`

**Motivation :**
> Connexion avec le dashboard. Le runner émet des events à chaque exécution. L'EventBus les distribue aux subscribers (API REST). Le MetricsStore agrège en fenêtre glissante. La SPA interroge l'API en polling et affiche logs/erreurs/metrics en temps quasi-réel. Aucune dépendance externe (pas de Redis, pas de DB).

---

## 2026-05-24 | Thème 2 — Dashboard Phase 2 | Modifié

**MODIFIÉ :**
- `dashboard/frontend/index.html` — SPA complète Phase 2 :
  - Graphiques metrics via Chart.js (error frequency bar chart, 5-min buckets)
  - Vue request ID (click sur request ID → modal avec tous les events d'une même requête)
  - Run function modal avec éditeur JSON textarea + résultat formaté
  - Détail par fonction (click → grid latence, logs récents, run history)
  - Error trending (total, affected functions, top error, bar chart frequency)
  - Auto-refresh 3s, debounced filters, responsive layout
- `dashboard/routes.ts` — Nouveau filtre `requestId` sur `/api/logs` ; nouvel endpoint `/api/functions/:name/history` ; run history in-memory (200 entries)

**Motivation :**
> Phase 1 avait une SPA minimale (tableau brut, prompt() pour run). Phase 2 ajoute les graphiques, le drill-down par fonction, le regroupement par request ID, l'éditeur JSON, le run history, et le trending des erreurs. Chart.js en CDN, zéro build step.

---

## 2026-05-24 | Cleanup — Audit fixes (stepper, barrel, aliases, types, context) | Modifié/Supprimé

**CRÉÉ :**
- `middleware/logger.ts` — `requestLogger()` middleware Hono : log `[aura] METHOD /path STATUS DURATIONms`

**MODIFIÉ :**
- `hono-app.ts` — CORS global via `hono/cors` (`AURA_APP_URL` ou `localhost:3000`) ; logger global `app.use("*", requestLogger())`

**Motivation :**
> La stack middleware Hono était incomplète. CORS et logging sont nécessaires pour le dashboard et le backend standalone. Les middlewares sont globaux (appliqués à toutes les routes). L'auth middleware reste à faire (internal secret / api key).

---

## 2026-05-24 | Cleanup — Audit alignement code | Modifié

**MODIFIÉ :**
- `client/stepper.ts` — Réécriture complète : supprimé `constructor()` dans interface + `...` placeholders. Renommé `createStepperForm` → `useStepperForm` (custom hook valide). Implémentation fonctionnelle avec zustand store + react-hook-form
- `client/index.ts` — Barrel nettoyé : tous les alias `useAura*`, `AuraClientProvider`, `configureAuraClient`, `callAuraOperation`, `fetchAuraManifest` supprimés du barrel public. Seuls les nouveaux noms sont exportés
- `server/context.ts` — Re-export shim supprimé (types `AuraAuditContext`, `AuraAuthContext`, `AuraCookieMutation`, `AuraRequestMetadata`, `AuraSessionData`, `AuraSource` ne sont plus re-exportés — à importer directement depuis `@/aura/core/types`). Gardé `AuraLogger`, `AuraSessionData`, `AuraSource` car importés par d'autres modules serveur
- `server/ai/agent.ts` — Propriété `name` supprimée de `AgentDefinition` (seul `_name` existe via `AgentRef`)
- `server/dashboard/routes.ts` — Correction type manifest (était traité comme dictionnaire, maintenant utilise `.operations.find()`)
- `server/runner.ts` — `opType === "mutate"` → `opType === "mutation"`
- `server/observability/metrics.ts` — Corrections types (percentile bounds, optional chaining)
- `AGENTS.md` — Section XML complète avec contexte, décisions, architecture, audits, next actions

**SUPPRIMÉ :**
- Tous les exports legacy du barrel client : `useAuraQuery`, `useAuraMutation`, `useAuraBroadcast`, `useAuraPaginatedQuery`, `useAuraAgentThread`, `useAuraAgentStream`, `useAuraAgentSend`, `AuraClientProvider`, `configureAuraClient`, `callAuraOperation`, `fetchAuraManifest`, `useAuraForm`, `useAuraParams`

**Motivation :**
> Audit complet du codebase : 42 `any` implicites, 23 patch wrappers/aliases, 3 circular deps, 2 blocs de dead code. Fixés selon la philosophie "réécrire, pas adapter". Les alias legacy dans le barrel public sont supprimés — seuls les nouveaux noms sont exportés. Les alias internes (dans provider.tsx, transport.ts, hooks.ts) sont conservés car utilisés en interne. AGENTS.md contient maintenant tout le contexte en XML pour reprise après reset.

---

## 2026-05-24 | Cleanup — Re-audit final | Fixé

**MODIFIÉ :**
- `server/routes/bridge.ts:59` — `Context<any, any, any>` → `Context` (dernier `any` réel)
- `ui/aura-form.tsx` — doc comment `useAuraMutation` → `useMutation`
- `ui/aura-data-table.tsx` — doc comment `useAuraPaginatedQuery` → `usePaginatedQuery`
- `AGENTS.md` — Section audit_results mise à jour avec les résultats frais (0 any, 0 wrappers, 0 dead code)

**Motivation :**
> Re-audit après fixes. Résultat : 0 `any` réel, 3 circular deps (toutes false-positives type-only), 0 patch wrappers dans le barrel, 0 dead code. useAuraForm/useAuraParams conservés car pas d'alias court possible (conflit avec react-hook-form et React Router).

---

## 2026-05-25 | Thème 3 | Modifié

**Auth middleware Hono factorisé**

- `packages/aura/src/server/middleware/auth.ts` — middleware commun pour le secret interne et la clé API, avec comparaison constant-time.
- `packages/aura/src/server/routes/internal.ts` — validation du secret interne déléguée au middleware.
- `packages/aura/src/server/routes/dashboard/routes.ts` — protection API optionnelle via `AURA_API_KEY`.
- `packages/aura/src/server/http-action.ts` — réutilise la validation du secret interne.
- `packages/aura/src/server/index.ts` — exports publics du middleware auth.

**Motivation :**
> Éviter la duplication de la logique de sécurité et préparer l’auth middleware demandé sans casser le mode dev actuel. Le dashboard n’exige la clé API que si `AURA_API_KEY` est configurée.

---

## 2026-05-25 | Restructuration | Ajouté/Modifié

**Audit architectural et nouvelle direction : plateforme runtime modulaire**

- `audit.md` — Audit architectural complet (10 sections, classement feature par feature, risques, décisions, architecture cible).
- `PLAN.md` → `PROMPT.md` — Renommé car PLAN.md contenait un prompt architecte, pas un plan.
- `PLAN.md` — Nouveau plan d'exécution en 5 phases (Phase 0-5) pour transformer le monolithe en plateforme modulaire.
- `PLAN_THEMATIQUE.md` — Réécrit avec les 5 thèmes de la nouvelle architecture (Core, Adapters, Plugins, CLI, Architecture finale).
- `TRACKER.md` — Mis à jour avec la nouvelle direction, les nouveaux phases, les décisions D8-D13.

---

## 2026-05-25 | Phase 0 | Ajouté/Modifié

**Contrats stables `@aura/core` + structure monorepo cible**

- `packages/core/` — Nouveau package avec les contrats types-only :
  - `src/plugin.ts` — `AuraPlugin`, `AuraPluginSetup` interfaces
  - `src/runtime.ts` — `AuraRuntime` interface
  - `src/context.ts` — `AuraContext` minimal + `ContextExtension` pattern
  - `src/operation.ts` — `AuraOperation`, `RegisteredAuraOperation`
  - `src/registry.ts` — `Registry` interface (operations + capabilities)
  - `src/manifest.ts` — Manifest types (copied from `shared/manifest.ts`)
  - `src/errors.ts` — `AuraError` (copied from `core/errors.ts`, zero deps)
  - `src/envelope.ts` — `AuraEnvelope` (copied from `core/envelope.ts`)
  - `src/types.ts` — Utility types (AuraSource, AuraLogger, AuraConfig, etc.)
  - `src/index.ts` — Barrel export
- Stubs créés : `server-hono/`, `client-react/`, `prisma/`, `cli/`, `plugins/`
- `packages/aura/src/core/types.ts` — Supprimé les imports `@/generated/prisma/client`, remplacé PrismaClient/AuraUser/NotificationDispatcher/AuraStorage par des interfaces minimales locales
- `tsconfig.base.json` — Ajout des paths `@aura/core`, `@aura/server-hono`, `@aura/client-react`, `@aura/prisma`, `@aura/cli`

---

## 2026-05-25 | Phase 1 | Ajouté

**Core Runtime : operation, registry, runner, config**

- `packages/core/src/operation.ts` — Réécrit avec le builder complet :
  - `defineOperationFn()` → RootStage → HandlerStage → AccessStage (chaînage complet)
  - `AuraOperation` générique (TInput, TParams, TOutput, TName) + phantom types
  - `RegisteredAuraOperation` (untyped, pour le registry)
  - `DefinedCommonFn`, `CommonFnArgs`, `HandlerArgs`, `OperationHandler`
  - Validation pure : `validateInput`, `validateParams`, `zodToFieldErrors`, `sanitizeNaNs`
  - `ensureAuthenticated` via `ctx.capabilities` (pas de dépendance Prisma/React)
  - Pas d'auto-registration — le builder retourne l'opération sans side-effect
- `packages/core/src/registry.ts` — `InMemoryRegistry` class concrète (implémente `Registry` interface) + `getClientManifest()`
- `packages/core/src/runner.ts` — `coreRunOperation()` runner pur :
  - Pas de `EventBus`, pas de `metricsStore`, pas de console log capture
  - Pas de `withTypedDb` (Prisma-specific), pas de `publishInvalidation`
  - Context injecté (pas de `createAuraContext` interne)
  - Access-level guard, execution, success/error envelope
- `packages/core/src/config.ts` — `validatePluginConfig()`, `resolveActivePlugins()`
- `packages/core/src/index.ts` — Barrel mis à jour avec tous les nouveaux exports

---

## 2026-05-25 | Phase 2 | Ajouté

**Adapters : @aura/server-hono, @aura/client-react, @aura/prisma**

### `@aura/server-hono`
- `hono-app.ts` — `createHonoApp(runtime: AuraRuntime): Hono` (CORS + logger globaux, routes bridge/manifest/health)
- `routes/bridge.ts` — dispatch POST `/aura/:path` via `coreRunOperation` + `runtime.createContext`
- `routes/manifest.ts` — GET `/manifest` depuis `runtime.operations.list()`
- `routes/health.ts` — GET `/health` (uptime, timestamp)
- `middleware/auth.ts` — `internalSecretMiddleware`, `apiKeyMiddleware`, `optionalApiKeyMiddleware` (comparaison constant-time, portable)
- `middleware/logger.ts` — `requestLogger` (méthode, path, status, durée)

### `@aura/client-react`
- `transport.ts` — `configureAura`, `callAura`, `fetchManifest`, `AuraClientError` + CSRF auto-heal
- `hooks.ts` — `useQuery`, `useMutation` wrappers TanStack Query avec `OperationRef` typing
- `provider.tsx` — `AuraProvider` (QueryClientProvider + contexte Aura)
- `hydration-boundary.tsx` — `AuraHydrationBoundary`

### `@aura/prisma`
- `db-readonly.ts` — `createReadOnlyDb(client)` Proxy qui bloque les écritures (whitelist reads)
- `pagination.ts` — `paginate()`, `encodeCursor`, `decodeCursor` (cursor base64url, web API compatible)
- `json.ts` — `toPrismaJson(value)` (BigInt → string, Error → message/stack, récursif)

---

## 2026-05-25 | Phase 3 | Ajouté

**Runtime concret + plugins officiels (auth, storage, cron)**

### `@aura/core` — Runtime concret
- `runtime.ts` — `AuraRuntimeImpl` class implémente `AuraRuntime` :
  - `registerPlugin()` + `start()` appelle `setup()` sur chaque plugin
  - `createContext()` construit le contexte avec extensions via `context.extend()`
  - Gestion des routes, migrations, générateurs, permissions, événements
  - `getClientManifest()`, `getPluginRoutes()`, `getPluginMigrations()`
- `registry.ts` — `getClientManifest()` ajouté à l'interface `Registry`
- `index.ts` — Exporte `AuraRuntimeImpl`

### `@aura/auth` — Plugin auth complet
- `password.ts` — `validatePassword`, `hashPassword` (bcryptjs), `verifyPassword`
- `phone.ts` — `normalizePhone` (libphonenumber-js)
- `otp.ts` — `createOtpChallenge`, `consumeOtpChallenge` (HMAC code, $transaction)
- `session.ts` — `resolveSessionFromRequest`, `createSession`, `revokeSession`, `revokeAllUserSessions`
- `crypto.ts` — `randomToken`, `randomNumericCode`, `sha256`, `hmacSha256`, `secureCompare`, `getAuraSecret`, `hashToken`, `hashOtpCode`
- `cookies.ts` — `parseCookieHeader`, `sessionCookieName`, `csrfCookieName`, `isSecureCookieEnvironment`
- `csrf.ts` — `createCsrfToken`, `verifyCsrfToken` (Web Crypto API)
- `operations.ts` — `createAuthPluginOperations(db)` retourne 4 ops (register, login, logout, me)
- `index.ts` — `createAuthPlugin(config)` : enregistre les ops + expose `ctx.auth`, `ctx.session`, `ctx.user`

### `@aura/storage` — Plugin storage
- `types.ts` — `AuraStorageDriver`, `AuraStorageUploadArgs/Result`, `AuraStoreArgs/Result`
- `filesystem.ts` — `filesystemDriver` (écriture disque, data URL, path traversal protection)

### `@aura/cron` — Types cron
- `index.ts` — `AuraCronJob`, `RunAuraCronResult`

### Infrastructure
- `package.json` — Workspaces étendus à `packages/plugins/*`
- `tsconfig.base.json` — Paths ajoutés pour `@aura/auth`, `@aura/storage`, `@aura/cron`

---

## 2026-05-25 | Phase 3 DX | Modifié

**Réécriture propre du contexte plugin façon Convex**

### `@aura/core`
- `context.ts` — Suppression du champ public `ctx.capabilities`
- `context.ts` — Ajout d'un contexte direct : `ctx.cookies`, `ctx.auth`, `ctx.session`, `ctx.user`, `ctx.rawRequest`
- `context.ts` — Ajout des types `AuraContextPatch`, `AuraContextExtensions`, `AuraAuthContext`, `AuraCookieContext`, `AuraResolvedSession`
- `plugin.ts` — `context.extend(key, fn)` remplacé par `context.extend(fn)` où `fn` retourne un patch de contexte
- `runtime.ts` — Les extensions sont mergées directement dans `ctx`, sans sac générique intermédiaire
- `runtime.ts` — Protection contre l'écrasement des clés core (`requestId`, `source`, `log`, `request`, `rawRequest`, `config`)
- `operation.ts` — `.auth()` vérifie maintenant `ctx.session` + `ctx.user`
- `registry.ts` — Suppression de `registerCapability/getCapability` devenus inutiles

### `@aura/auth`
- `index.ts` — Le plugin auth résout la session pendant `createContext()` et injecte directement `ctx.auth`, `ctx.session`, `ctx.user`
- `operations.ts` — `auth.me` retourne maintenant `ctx.user` au lieu d'une propriété inexistante sur `ctx.session`

### `@aura/server-hono`
- `routes/bridge.ts` — Sérialise les cookies produits par `ctx.cookies.set` en headers `Set-Cookie`
