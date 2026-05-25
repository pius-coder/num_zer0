# Audit Architectural — Projet Aura

> **Contexte :** Monorepo Bun, TypeScript full-stack, TanStack Start/React, Hono, Prisma/Postgres.
> **Objectif visé :** Noyau modulaire, stable, réutilisable, extensible par plugins communautaires.
> **Auditeur :** revue critique, sans complaisance.

---

## 1. Verdict Global

Aura a une base de DX opérationnelle forte, mais **pas encore une architecture de plateforme modulaire**. Aujourd'hui, `@aura-js/core` est un framework monolithique qui contient runtime, transport Hono, Prisma/Postgres, React hooks, UI, dashboard, AI, search, vector, storage, cron, workflows, auth et CLI dans le **même package**. C'est efficace pour un MVP, mais incompatible avec l'objectif "noyau stable + plugins communautaires".

Le problème principal n'est pas le nombre de features. Le problème est que les features **ne sont pas branchées via des contrats**. Elles sont importées directement, enregistrées dans des Maps locales, montées explicitement dans Hono, exposées par le barrel serveur, et souvent couplées à Prisma, React, LangChain ou au dashboard.

**Preuves :**
- `packages/aura/src/server/index.ts` — exporte tout dans un seul barrel (opérations, cron, workflows, AI, search, vector, dashboard, eventBus, metricsStore, auth middleware).
- `packages/aura/src/server/hono-app.ts` — monte six routers en dur (bridge, internal, files, health, http-actions, dashboard).
- `packages/aura/src/server/create-context.ts` — construit un contexte qui contient DB, auth, notify, bump, log, audit, storage, scheduler, agent, pagination, invalidation, fetch — le tout au même niveau.
- `packages/aura/package.json` — dépend de S3 (`@aws-sdk/client-s3`), LangChain (`@langchain/core`), React, React DOM, shadcn-ish UI libs, Recharts, TanStack Router, etc.

Aura **peut** devenir un système sérieux de modules branchables, mais il faut inverser l'architecture : le core ne doit plus connaître les features. Les features doivent déclarer leurs capacités au runtime via un contrat `AuraPlugin`.

---

## 2. Ce Qui Doit Être Le Core

Le vrai core doit être **petit, stable, sans dépendance feature concrete**.

| Composant | Raison |
|-----------|--------|
| `defineOperationFn` + query/mutate/action | Langage principal d'Aura |
| Registry centralisé des capabilities (pas seulement operations) | Découverte et composition |
| Runner d'opérations (sans observability/invalidation/broadcast hardcodés) | Dispatch pur |
| `AuraError`, `successEnvelope`, `errorEnvelope` | Contrat d'erreur stable |
| Transport bridge HTTP (minimal) | Appels externes |
| Contrat `AuraPlugin` : setup, context, routes, manifest, migrations, permissions | Extensibilité |
| Config loader + validation | Chargement standardisé |
| Manifest client versionné | Découverte par le client |
| Client transport hook `useQuery`/`useMutation` (abstrait, pas React) | Appels depuis n'importe quel runtime |
| CLI minimal : init, dev, generate registry, inspect plugins | DX de base |

Ce que ça supprime du core actuel : Prisma, React, Hono, AI, search, vector, dashboard, storage, cron, workflows, auth, broadcast, observability, UI, pagination, invalidation impl, params, hydration.

---

## 3. Ce Qui Doit Devenir Un Plugin Officiel

Chaque plugin est un package npm séparé qui implémente `AuraPlugin` et peut être activé/désactivé dans la config.

| Plugin | Package proposé | Dépendances probables |
|--------|----------------|----------------------|
| Auth | `@aura/auth` | sessions, password hashing, OTP, OAuth providers |
| Storage | `@aura/storage` | `fs`, `@aws-sdk/client-s3` (optionnel) |
| Cron | `@aura/cron` | cron-parser, job queue |
| Workflows | `@aura/workflows` | step/sleep persistence |
| HTTP Actions | `@aura/http-actions` | webhook dispatch |
| Broadcast / Realtime | `@aura/realtime` | WebSocket, HMAC |
| Observability | `@aura/observability` | EventBus, MetricsStore, logging |
| Dashboard | `@aura/dashboard` | SPA, Chart.js, runtime introspection API |
| AI | `@aura/ai` | LangChain ou autre provider |
| Search Postgres | `@aura/search-postgres` | SQL FTS |
| Vector pgvector | `@aura/vector-pgvector` | pgvector SQL |
| Pagination Prisma | `@aura/pagination-prisma` | cursor encoding |
| Invalidation Broadcast | `@aura/invalidation-realtime` | broadcast dispatch |
| Params/Router | `@aura/params-tanstack` | TanStack Router integration |

---

## 4. Ce Qui Doit Devenir Un Package Séparé

Ces packages ne sont pas des plugins runtime — ce sont des **adpaters ou des librairies optionnelles**.

| Package | Rôle |
|---------|------|
| `@aura/server-hono` | Adapter Hono : app factory, bridge routes, middleware |
| `@aura/client-react` | React Query hooks, AuraProvider, hydration boundary |
| `@aura/client-vue` | (futur) hooks Vue |
| `@aura/cli` | CLI complet : codegen, make, doctor, plugin inspect |
| `@aura/ui` | Composants UI (shadcn-style) — 100% optionnel |
| `@aura/prisma` | Adapter Prisma, migrations Aura, types DB |
| `@aura/typescript-config` | Base tsconfig partagée |

Le package actuel `@aura-js/core` serait éclaté en `@aura/core` (runtime) + `@aura/server-hono` (HTTP) + `@aura/client-react` (frontend) + `@aura/prisma` (DB) + `@aura/cli` (outillage).

---

## 5. Ce Qui Doit Être Supprimé Ou Fortement Simplifié

| Élément | Problème | Action |
|---------|----------|--------|
| `AuraContext` tout-en-un | Expose db, storage, scheduler, agent, paginate, invalidate, fetch — trop de surface | Remplacer par context extensible : `ctx.capabilities.storage`, `ctx.capabilities.agent` |
| Registres feature-specific | Chaque feature a sa propre Map (operations, cron, workflow, agent, search, vector) | Unifier en un registry de capabilities typé |
| Import `@/generated/prisma/client` dans le core | Couplage à l'app hôte | Déplacer dans `@aura/prisma` |
| `discovery.ts` liste figée des types | Les plugins ne peuvent pas ajouter de suffixes | Rendre extensible via `AuraPlugin` |
| `hono-app.ts` routes hardcodées | Dashboard toujours monté | Monter depuis les plugins uniquement |
| `create-context.ts` importe `cache` de React | React importé côté serveur | Déplacer dans l'adapter React |
| `ai/agent.ts` LangChain hardcodé | Provider AI imposé | Plugin AI extensible |
| `observability/event-bus.ts` et `metrics.ts` dans le core | Runtime et monitoring mélangés | Plugin `@aura/observability` |
| `dashboard/` dans le core | Feature produit dans le runtime | Plugin `@aura/dashboard` |
| `server/index.ts` barrel monolithique | Toutes les features exportées ensemble | Exporter seulement le core |

---

## 6. Classement Feature Par Feature (complet)

| Feature | Core | Plugin | Package Séparé | Supprimer | Justification |
|---------|------|--------|---------------|-----------|---------------|
| defineOperationFn (query/mutate/action) | ✅ | | | | Langage de base d'Aura |
| Registry / manifest | ✅ | | | | Découverte et contrat |
| Runner dispatch | ✅ | | | | Exécution des ops |
| Envelope / AuraError | ✅ | | | | Contrat d'erreur stable |
| Transport bridge HTTP | | | ✅ | | Adapter Hono |
| Auth | | ✅ | | | Trop spécifique pour le core |
| Storage | | ✅ | | | Drivers multiples |
| Cron | | ✅ | | | Scheduling ≠ core |
| Workflows | | ✅ | | | Durée longue, persistence |
| HTTP actions | | ✅ | | | Webhooks, callbacks |
| Broadcast / Realtime | | ✅ | | | WebSocket, fanout |
| Observability | | ✅ | | | EventBus, metrics, logging |
| Dashboard | | ✅ | | | Produit, pas runtime |
| AI | | ✅ | | | Provider-dependent |
| Search | | ✅ | | | Postgres FTS |
| Vector | | ✅ | | | pgvector |
| Pagination | | | ✅ | | Adapter Prisma |
| Invalidation (contract) | ✅ | | | | Contrat stable |
| Invalidation (broadcast) | | ✅ | | | Implementation réelle |
| Params | | | ✅ | | Router-specific |
| Hydration | | | ✅ | | TanStack Start specific |
| UI components | | | ✅ | | 100% optionnel |
| Client hooks React | | | ✅ | | Adapter React |
| CLI | | | ✅ | | Outillage |
| Discovery (suffix hardcodés) | | | | ✅ | Remplacer par plugin extensible |
| Contexte monolithique (`AuraContext`) | | | | ✅ | Remplacer par context extensible |
| `create-context.ts` React import | | | | ✅ | Sortir du core |
| `hono-app.ts` routes hardcodées | | | | ✅ | Remplacer par mounting plugin |

---

## 7. Les 10 Plus Gros Risques Architecturaux

1. **Core trop gros** — Le barrel `packages/aura/src/server/index.ts` exporte toutes les features en vrac. Impossible de n'importer que le runtime sans tirer le dashboard, l'AI, le search et le storage.

2. **Couplage Prisma app-specific** — `packages/aura/src/server/context.ts` importe `@/generated/prisma/client`. Le core ne peut pas être extrait sans cette génération.

3. **Couplage React dans le serveur** — `packages/aura/src/server/create-context.ts:3` importe `cache` de `react`. Le runtime serveur dépend du framework frontend.

4. **Hono app monolithique** — `packages/aura/src/server/hono-app.ts` monte cinq à six routers en dur. Impossible pour un plugin d'ajouter ses routes.

5. **Context public instable** — `AuraContext` dans `packages/aura/src/server/context.ts` grandit avec chaque feature. Aucune séparation entre capabilities essentielles et optionnelles. Le moindre changement est un breaking change.

6. **Registries dispersés** — Chaque feature maintient sa propre `Map` (operations, cron, workflow, agent, search, vector, http actions). Pas de registry central, pas de découverte unifiée, pas de type common pour tous les artefacts.

7. **Dashboard non découplé** — `packages/aura/src/server/dashboard/routes.ts` accède directement au registry, à l'eventBus, au metricsStore et au runner. Il ne peut pas fonctionner avec une autre source de données.

8. **Features optionnelles traitées comme obligatoires** — L'observability, l'invalidation, le broadcast sont intégrés dans le runner (`runner.ts`). Impossible d'exécuter une opération sans EventBus ou metrics.

9. **CLI non extensible** — `packages/aura/src/cli/make.ts` encode les types d'artefacts en dur. Un plugin ne peut pas ajouter son propre générateur de stubs.

10. **Packaging impossible à publier** — Le core dépend de S3, LangChain, React, Prisma, Recharts, etc. Même désactivées, ces dépendances sont installées. La surface d'attaque et la taille sont inacceptables pour un package npm publique.

---

## 8. Les 10 Décisions Les Plus Importantes À Prendre

1. **Aura est-il un framework monolithique ou une plateforme runtime ?** → Choisir **plateforme runtime**. C'est la seule voie vers l'extensibilité communautaire.

2. **Définir `AuraPlugin` comme contrat central.** Le plugin est la seule manière d'ajouter des opérations, routes, context, manifest, migrations, permissions, CLI. Pas d'exception pour les plugins officiels.

3. **Prisma est un adapter, pas le core.** Le core ne doit pas connaître Prisma. `@aura/prisma` implémente le contrat DB, et le runtime reçoit un PrismaClient injecté.

4. **React/TanStack est un client officiel, pas le core.** Le core définit le transport et le client abstrait. `@aura/client-react` implémente les hooks React.

5. **Hono est un adapter officiel, pas toute l'architecture.** Le runtime doit pouvoir tourner sans Hono (tests, workers, CLI). L'adaptateur Hono monte les routes des plugins.

6. **Capacités stables du plugin :** `operation`, `route`, `context`, `manifest`, `migration`, `client`, `cli`. Toute feature qui ne correspond pas à une de ces capacités est soit un adapter, soit un package séparé.

7. **Politique de version :** les plugins déclarent un peer range sur `@aura/core`. SemVer strict. Le core est stable 1.0 avant d'autoriser les plugins communautaires.

8. **Déclaration des migrations :** chaque plugin peut déclarer des migrations Prisma/SQL. Le `@aura/prisma` adapter collecte et exécute les migrations de tous les plugins actifs.

9. **Dashboard = consommateur de l'API d'introspection.** Ne lit jamais le registry, l'eventBus ou le metricsStore directement. Appelle `runtime.plugins`, `runtime.operations.list()`, etc.

10. **Modèle de registry communautaire :** package npm + fichier `aura.json` dans le package. `aura.json` contient les metadata (compatible core version, capabilities déclarées, dépendances plugins). Le CLI peut `aura:install` un plugin en updatant la config.

---

## 9. Architecture Cible Proposée

### 9.1 — Contrat Core

```ts
// @aura/core

export interface AuraPlugin {
  name: string
  version: string
  requires?: {
    aura: string                    // semver range
    plugins?: Record<string, string> // semver ranges
  }
  config?: z.ZodSchema
  setup(ctx: AuraPluginSetup): void | Promise<void>
}

export interface AuraPluginSetup {
  operations: {
    register(op: AuraOperation): void
    get(name: string): AuraOperation | null
    list(): AuraOperation[]
  }
  routes: {
    register(opts: { mount: string; router: AuraRouter }): void
  }
  context: {
    extend<T>(name: string, factory: (ctx: AuraContext) => T): void
  }
  manifest: {
    extend(key: string, value: unknown): void
  }
  migrations: {
    register(dir: string): void
  }
  cli: {
    registerGenerator(type: string, generator: AuraCliGenerator): void
  }
  permissions: {
    define(name: string, check: AuraPermissionCheck): void
  }
  events: {
    subscribe(event: string, handler: AuraEventHandler): void
  }
}
```

### 9.2 — App Hôte

```ts
// apps/app/aura.config.ts
export default defineAuraApp({
  plugins: [
    hono({ port: 3001 }),
    prisma({ url: process.env.DATABASE_URL }),
    dashboard(),
    auth({
      providers: [password(), otp(), google()],
    }),
    storage({ driver: "s3" }),
    cron(),
    workflows(),
    ai({ provider: "openai" }),
  ],
})
```

### 9.3 — Runtime Backend

- Le runtime charge la config Aura.
- Initialise chaque plugin via `plugin.setup(runtime)`.
- Chaque plugin enregistre ses opérations, routes, extensions de contexte, manifest, migrations, permissions.
- Le runtime construit un registry unifié de capabilities.
- L'adaptateur Hono appelle `runtime.routes` pour monter les routeurs.
- Le contexte par requête est construit dynamiquement : core (request, session, log) + extensions des plugins actifs.
- Le manifest client est généré depuis `runtime.operations.list()` + extensions des plugins.

### 9.4 — Dashboard

- Le dashboard devient un plugin `@aura/dashboard`.
- Il n'accède plus directement à `eventBus`, `metricsStore` ou `registry`.
- Il expose une API REST d'introspection qui lit le runtime.
- Les graphiques et les logs sont produits par les données exposées via le runtime — pas par des imports directs.

### 9.5 — Plugins Communautaires

- Un plugin communautaire est un package npm avec `aura.json`.
- Il implémente `AuraPlugin` et peut déclarer :
  - des opérations (self-registering via discovery ou import explicite)
  - des routes (mount Hono)
  - des extensions de contexte (storage, AI, etc.)
  - des migrations (SQL/Prisma dans un dossier)
  - des permissions (checks)
  - des générateurs CLI (nouveaux stubs)
  - des abonnements à des events (invalidation, cron tick)
- Il peut activer/désactiver sans casser le reste si les capacités optionnelles sont bien typées.

---

## 10. Recommandation Claire

**Ne continue pas en monolithe framework.** La bonne direction est :

> **Plateforme runtime + Core minimal + Plugins officiels + Registry communautaire**

Pas "core + quelques plugins" superficiel. Il faut **réellement retirer du core toutes les features concrètes**. Si AI/search/vector restent codés comme exports privilégiés du core, les plugins communautaires seront toujours des citoyens de seconde classe.

| Modèle | Verdict |
|--------|---------|
| Framework monolithique actuel | ❌ Bloque l'extensibilité, packaging impossible |
| Core + plugins officiels | ✅ Réaliste, bonne DX |
| Plateforme runtime pure | ✅ Ambition la plus défendable |
| Registry communautaire | 🟢 Possible en phase 2 |

---

## 11. Conclusion Directe

**Aura peut-il devenir un système de modules branchables sérieux ?**

Oui, mais **pas avec l'architecture actuelle**. Aujourd'hui, Aura est un framework full-stack intégré, pas une plateforme extensible.

**Que faut-il changer pour que ce soit vrai ?**

1. Le core doit cesser de connaître les features. Un plugin officiel et un plugin communautaire doivent utiliser exactement le même mécanisme pour déclarer routes, opérations, contexte, migrations, manifest et CLI.
2. `hono-app.ts`, `server/index.ts`, `create-context.ts`, `runner.ts` et les registres feature-specific doivent disparaître en tant que point d'entrée central. Remplacer par un runtime qui collecte les plugins et construit l'application à partir de leurs déclarations.
3. L'invalidation, l'observability, le broadcast ne doivent pas être dans le chemin critique du runner. Un plugin d'observability peut souscrire aux événements du runtime sans être obligatoire.
4. Le barrel `@aura-js/core` doit être éclaté en `@aura/core` + `@aura/server-hono` + `@aura/client-react` + `@aura/prisma` + `@aura/cli` + plugins officiels.
5. La première priorité immédiate n'est pas d'ajouter des features. C'est de définir `AuraPlugin`, de migrer une feature (ex: auth) hors du core via ce contrat, et de prouver que le système fonctionne.
