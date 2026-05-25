# Plan Aura — Restructuration Totale

> **Objectif :** Transformer Aura d'un framework monolithique en une **plateforme runtime modulaire** avec core minimal, plugins branchables, adapters officiels et extensibilité communautaire.
>
> Ce plan remplace l'ancien PLAN.md (renommé PROMPT.md). Basé sur l'audit architectural (audit.md).

---

## Vision

```
@aura/core          ← runtime minimal + AuraPlugin contract
@aura/server-hono   ← adapter HTTP (Hono)
@aura/client-react  ← adapter frontend (React/TanStack)
@aura/prisma        ← adapter DB (Prisma)
@aura/cli           ← outillage
@aura/ui            ← composants UI optionnels
@aura/*             ← plugins officiels (auth, storage, cron, workflows, ai, etc.)
aura-community/*    ← plugins communautaires
```

---

## Contrat Central : AuraPlugin

```ts
interface AuraPlugin {
  name: string
  version: string
  requires?: { aura: string; plugins?: Record<string, string> }
  config?: z.ZodSchema
  setup(ctx: AuraPluginSetup): void | Promise<void>
}

interface AuraPluginSetup {
  operations: { register, get, list }
  routes:     { register }
  context:    { extend }
  manifest:   { extend }
  migrations: { register }
  cli:        { registerGenerator }
  permissions:{ define }
  events:     { subscribe }
}
```

Tout — plugins officiels ET communautaires — utilise EXACTEMENT ce même contrat.

---

## Phases d'Exécution

### Phase 0 — Fondations (SEMAINE 1)

**But :** Définir les contrats, créer la structure de packages, établir les règles.

1. Créer la structure monorepo cible :
   ```
   packages/
     core/           ← @aura/core
     server-hono/    ← @aura/server-hono
     client-react/   ← @aura/client-react
     prisma/         ← @aura/prisma
     cli/            ← @aura/cli
     plugins/        ← plugins officiels (auth, storage, cron, workflows, ai, ...)
   ```

2. Définir `AuraPlugin` contract dans `packages/core/src/plugin.ts`
3. Définir `AuraRuntime` dans `packages/core/src/runtime.ts`
4. Définir `AuraContext` minimal + `ContextExtension` pattern
5. Définir `Operation`, `Registry`, `Manifest` types stables
6. Définir `AuraError`, `Envelope`
7. Supprimer tout import `@/generated/prisma/client` du core
8. Supprimer tout import React du core
9. Supprimer tout import Hono du core
10. Créer `tsconfig.base.json` avec paths cibles

**Livrables :**
- `packages/core/` avec contrats types-only
- Aucune feature migrée — juste les interfaces

---

### Phase 1 — Core Runtime (SEMAINE 2)

**But :** Extraire le runtime réel du monolithe actuel.

1. Migrer `operation.ts` → `packages/core/src/operation.ts`
   - Garder `defineOperationFn`, builder, validation
   - Retirer les imports Prisma, React, dashboard, observability
2. Migrer `registry.ts` → `packages/core/src/registry.ts`
   - Registry de capabilities unifié (pas seulement operations)
   - Supporte `AuraPlugin`
3. Migrer `runner.ts` → `packages/core/src/runner.ts`
   - Runner pur — sans EventBus, sans metrics, sans invalidation
   - Les plugins souscrivent via `events.subscribe`
4. Migrer `errors.ts`, `envelope.ts` → `packages/core/src/`
5. Créer `packages/core/src/config.ts` — config loader + validation plugin
6. Créer `packages/core/src/manifest.ts` — manifest builder depuis registry
7. Créer `packages/core/src/context.ts` :
   ```ts
   interface AuraContext {
     requestId: string
     source: string
     log: AuraLogger
     config: AuraConfig
     capabilities: Record<string, unknown>  // extends via plugins
   }
   ```

**Suppressions directes :**
- `create-context.ts` — remplacé par le runtime qui build le context depuis les plugins
- `context.ts` — remplacé par le nouveau contrat
- `runner.ts` old — remplacé par runner pur
- `registry.ts` old — remplacé par registry unifié

---

### Phase 2 — Adapters (SEMAINE 3)

**But :** Sortir Hono, Prisma, React du core.

#### `packages/server-hono/`

1. Migrer `hono-app.ts` → adapter Hono :
   ```ts
   function createHonoApp(runtime: AuraRuntime): Hono
   ```
   - Monte les routes depuis `runtime.plugins`
   - Plus de routes hardcodées
2. Migrer `routes/bridge.ts` → transport bridge standard
3. Créer middleware CORS, CSRF, rate-limit comme plugins intégrés
4. Migrer `routes/health.ts` → plugin health par défaut
5. Migrer `routes/files.ts` → via storage plugin
6. Migrer `routes/internal.ts` → via cron plugin
7. Migrer `routes/http-actions.ts` → via http-actions plugin

#### `packages/prisma/`

1. Créer adapter Prisma : injecte `PrismaClient` dans le runtime
2. Créer système de migrations plugins
3. Créer helpers pagination, entity-tracker comme utils Prisma

#### `packages/client-react/`

1. `useQuery`, `useMutation` — pur React Query
2. `AuraProvider` — contexte React
3. `AuraHydrationBoundary` — SSR TanStack

---

### Phase 3 — Plugins Officiels (SEMAINES 4-5)

**But :** Chaque feature devient un plugin indépendant.

| Plugin | À faire |
|--------|---------|
| `@aura/auth` | sessions, password, OTP, OAuth, permissions |
| `@aura/storage` | filesystem driver, S3 driver, R2 driver |
| `@aura/cron` | cron parsing, job registry, execution |
| `@aura/workflows` | step/sleep persistence, resume, scheduler |
| `@aura/http-actions` | webhook dispatch, access control |
| `@aura/realtime` | WebSocket, broadcast, invalidation fanout |
| `@aura/observability` | EventBus, MetricsStore, logging, export |
| `@aura/dashboard` | SPA, introspection API, metrics graphs |
| `@aura/ai` | LangChain adapter, OpenAI, OpenRouter |
| `@aura/search-postgres` | FTS index, search queries |
| `@aura/vector-pgvector` | pgvector index, similarity search |
| `@aura/pagination-prisma` | cursor encoding, pagination helper |

Chaque plugin :
- implémente `AuraPlugin`
- a son propre `package.json` avec ses dépendances
- peut être activé/désactivé via config
- déclare ses migrations Prisma
- peut être testé indépendamment

**Règle stricte :** Aucun plugin n'importe depuis un autre plugin. Ils ne communiquent que via le runtime.

---

### Phase 4 — Tooling & DX (SEMAINE 6)

**But :** CLI, codegen, discovery, registry communautaire.

#### `packages/cli/`

1. `aura init` — setup project with config
2. `aura dev` — run avec plugins sélectionnés
3. `aura generate` — codegen registry depuis les plugins
4. `aura make` — stubs extensibles par plugin
5. `aura doctor` — validate config, dependencies, migrations
6. `aura plugin:list` — show installed plugins
7. `aura plugin:add <package>` — install plugin

#### Discovery

- Remplacer `discovery.ts` hardcodé par des générateurs de registry
- Chaque plugin déclare ses suffixes de fichiers
- Le CLI génère `_registry.ts` depuis la config + plugins

---

### Phase 5 — Nettoyage & Stabilisation (SEMAINE 7)

**But :** Supprimer tout le code legacy, verrouiller les contrats.

1. Supprimer l'ancien `packages/aura/` — remplacer par les nouveaux packages
2. Supprimer `packages/aura/src/server/` — features migrées vers plugins
3. Supprimer `packages/aura/src/client/` — remplacé par `@aura/client-react`
4. Supprimer `packages/aura/src/ui/` — package séparé `@aura/ui`
5. Supprimer `packages/aura/src/cli/` — remplacé par `@aura/cli`
6. Supprimer `packages/aura/prisma/` — remplacé par `@aura/prisma`
7. Supprimer `packages/aura/aura.config.ts`
8. Mettre à jour les scripts racine `package.json`
9. Mettre à jour les Dockerfiles
10. Stabiliser `AuraPlugin` contract en v1.0

---

## Suppressions Immédiates (Phase 0)

| Fichier/Dossier | Raison |
|----------------|--------|
| `packages/aura/src/server/create-context.ts` | À réécrire — contexte monolithique |
| `packages/aura/src/server/context.ts` | À remplacer — trop de responsabilités |
| `packages/aura/src/server/dashboard/` | Plugin, pas core |
| `packages/aura/src/server/observability/` | Plugin, pas core |
| `packages/aura/src/server/ai/` | Plugin, pas core |
| `packages/aura/src/server/search.ts` | Plugin, pas core |
| `packages/aura/src/server/vector.ts` | Plugin, pas core |
| `packages/aura/src/server/workflow.ts` | Plugin, pas core |
| `packages/aura/src/server/cron.ts` | Plugin, pas core |
| `packages/aura/src/server/storage/` | Plugin, pas core |
| `packages/aura/src/server/auth/` | Plugin, pas core |
| `packages/aura/src/server/broadcast.ts` | Plugin, pas core |
| `packages/aura/src/server/notifications.ts` | Plugin, pas core |
| `packages/aura/src/server/outbox.ts` | Plugin, pas core |
| `packages/aura/src/server/entity-tracker.ts` | Prisma adapter |
| `packages/aura/src/server/scheduler.ts` | Plugin, pas core |
| `packages/aura/src/server/db.ts` | Prisma adapter |
| `packages/aura/src/server/db-readonly.ts` | Prisma adapter |
| `packages/aura/src/server/http-action.ts` | Plugin |
| `packages/aura/src/server/discovery.ts` | À réécrire — extensible |
| `packages/aura/src/server/hydration.tsx` | Adapter React |
| `packages/aura/src/server/manifest-injector.tsx` | Adapter React |
| `packages/aura/src/server/context-adapter.ts` | Adapter TanStack |
| `packages/aura/src/server/hono-app.ts` | Adapter Hono — à réécrire |
| `packages/aura/src/server/routes/` | Adapter Hono |
| `packages/aura/src/server/middleware/` | Adapter Hono |
| `packages/aura/src/server/transport/` | Adapter Hono |
| `packages/aura/src/server/index.ts` | Barrel monolithique |
| `packages/aura/src/client/` | Adapter React |
| `packages/aura/src/ui/` | Package séparé |
| `packages/aura/src/cli/` | Package séparé |

---

## Réécritures Complètes

| Élément | Ancien | Nouveau |
|---------|--------|---------|
| Context | `AuraContext` monolithique | Context minimal + extensions |
| Registry | Maps dispersées par feature | Registry unifié de capabilities |
| Runner | Hardcode EventBus + metrics + invalidation | Runner pur + events |
| Hono app | Routes hardcodées | Routes depuis plugins |
| Discovery | Table de suffixes en dur | Extensible via plugins |
| CLI | Generateurs en dur | Generateurs via plugins |
| Server barrel | Toutes les features exportées | Core uniquement |

---

## Contrats Stables (à définir avant Phase 1)

| Contrat | Priorité |
|---------|----------|
| `AuraPlugin` | 🔴 Critique |
| `AuraRuntime` | 🔴 Critique |
| `AuraContext` + extensions | 🔴 Critique |
| `AuraOperation` | 🔴 Critique |
| `Registry` | 🔴 Critique |
| `AuraError` / `Envelope` | 🔴 Critique |
| `Manifest` | 🟡 Haute |
| `AuraConfig` | 🟡 Haute |
| `Migration` déclaration | 🟡 Haute |
| `Permission` check | 🟢 Moyenne |
| `CLI` generator interface | 🟢 Moyenne |

---

## Breaking Changes Volontaires

| Breaking Change | Impact | Accepté ? |
|----------------|--------|-----------|
| Suppression de `AuraContext.db` direct | Tous les handlers doivent utiliser `ctx.capabilities.db` | ✅ Oui |
| Suppression de `AuraContext.storage` direct | Idem | ✅ Oui |
| Suppression de `AuraContext.scheduler` direct | Idem | ✅ Oui |
| Suppression de `AuraContext.agent` direct | Idem | ✅ Oui |
| Suppression de `AuraContext.paginate` direct | Idem | ✅ Oui |
| Suppression de `@aura-js/core` exports actuels | Tous les imports changent | ✅ Oui |
| `runner.ts` sans observability | Les plugins doivent souscrire | ✅ Oui |
| `hono-app.ts` sans routes hardcodées | Les plugins montent leurs routes | ✅ Oui |
| `createAuraHonoApp()` prend un `Runtime` | Signature change | ✅ Oui |
| CLI commandes changent | `aura:make` → `aura make` | ✅ Oui |

---

## Risques si on Continue l'Architecture Actuelle

1. **Impossible à publier** — 30+ dépendances lourdes dans un seul package
2. **Aucune extensibilité communautaire** — pas de contrat pour brancher des plugins
3. **Breaking changes permanents** — chaque feature ajoutée modifie `AuraContext`
4. **Maintenabilité décroissante** — le runner, le contexte et le barrel grossissent
5. **Couplage React serveur** — impossible d'avoir un runtime sans React
6. **Couplage Prisma** — impossible de changer de DB sans tout casser
7. **Dashboard rigide** — lit directement le registry, l'eventBus, les metrics
8. **Tests impossibles** — trop de dépendances à mocker
9. **CLI non extensible** — impossible d'ajouter un generateur depuis un plugin
10. **Positionnement flou** — ni framework, ni runtime, ni plateforme

---

## Décisions Non Négociables

1. Aura est une **plateforme runtime**, pas un framework monolithique.
2. Tout passe par `AuraPlugin`. Pas d'exception pour les plugins officiels.
3. Prisma est un adapter. Le core ne connaît pas Prisma.
4. React est un client. Le core ne connaît pas React.
5. Hono est un adapter HTTP. Le core fonctionne sans Hono.
6. Le contexte est extensible par plugins. Pas de `AuraContext` monolithique.
7. Le runner est pur. Pas d'observability/invalidation dans le chemin critique.
8. Les migrations sont déclarées par les plugins.
9. Le CLI est extensible par plugins.
10. SemVer strict. Core 1.0 avant plugins communautaires.

---

## Conclusion

Le monolithe actuel est efficace pour un MVP mais bloque toute extensibilité sérieuse.
La seule voie viable est : **core minimal + plugins + adapters**.

Chaque phase ci-dessus transforme une partie du monolithe en composant indépendant.
À la fin de la Phase 5, Aura sera une vraie plateforme runtime extensible.
