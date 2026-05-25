# Aura — Tracker d'Avancement

> Fichier source de vérité pour reprendre le travail après un reset de contexte.
> Chaque session lit ce fichier pour savoir exactement où on en est.

---

## Resume Session (lecture obligatoire après reset)

**Projet :** Aura — **plateforme runtime modulaire** en monorepo Bun. Restructuration d'un framework monolithique en core minimal + plugins.

**Structure actuelle :** `packages/aura/` = monolithe `@aura-js/core` (server, client, ui, core, cli).
**Structure cible :** `packages/core/` + `packages/server-hono/` + `packages/client-react/` + `packages/prisma/` + `packages/cli/` + `packages/ui/` + `packages/plugins/*`.

**Direction imposée :**
- Supprimer le monolithe `@aura-js/core`
- Créer `@aura/core` (runtime minimal + contrats plugins)
- Chaque feature devient un plugin indépendant (`@aura/auth`, `@aura/storage`, `@aura/dashboard`, etc.)
- Hono, Prisma, React deviennent des adapters optionnels
- Les plugins officiels ET communautaires utilisent EXACTEMENT le même contrat `AuraPlugin`

**Dernier commit :** `304d91a` "docs: add architectural audit"
**PLAN.md a été renommé PROMPT.md** (contient le prompt architecte original) et remplacé par un plan d'exécution complet.

**Prochaine action :** Phase 0 — Définir les contrats stables (AuraPlugin, AuraRuntime, AuraContext) avant toute extraction.

**Pièges connus :**
- Toutes les features sont encore dans `packages/aura/` — aucune extraction n'a commencé.
- `packages/aura/` importe `@/generated/prisma/client` (app-specific) — à couper en Phase 0.
- Le barrel `packages/aura/src/server/index.ts` exporte tout — à supprimer.
- `packages/aura/package.json` a 30+ dépendances — c'est exactement le problème à résoudre.

**Fichiers clés :**
- `PROMPT.md` = prompt architecte original (ancien PLAN.md)
- `PLAN.md` = plan d'exécution de la restructuration
- `PLAN_THEMATIQUE.md` = thèmes détaillés (core, adapters, plugins, CLI)
- `audit.md` = audit architectural complet
- `TRACKER.md` = CE FICHIER
- `CHANGELOG.md` = log des modifications

---

## Architecture — État Actuel (monolithe à restructurer)

```
packages/aura/       ← @aura-js/core (MONOLITHE — à éclater)
  ├── src/server/    ← Runtime + Hono + AI/Search/Vector/Storage/Dashboard — TOUT
  ├── src/client/    ← React hooks (à extraire dans @aura/client-react)
  ├── src/ui/        ← 71 composants (à extraire dans @aura/ui)
  ├── src/cli/       ← CLI (à extraire dans @aura/cli)
  ├── src/core/      ← Types, errors, envelopes (bon — à garder)
  └── prisma/        ← Schéma Prisma (à extraire dans @aura/prisma)
```

## Architecture Cible

```
num_zer0/
├── packages/
│   ├── core/                 ← @aura/core (runtime minimal + AuraPlugin contrat)
│   ├── server-hono/          ← @aura/server-hono (adapter HTTP)
│   ├── client-react/         ← @aura/client-react (adapter frontend)
│   ├── prisma/               ← @aura/prisma (adapter DB)
│   ├── cli/                  ← @aura/cli (outillage)
│   ├── ui/                   ← @aura/ui (composants optionnels)
│   └── plugins/              ← Plugins officiels
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
│       └── src/operations/   ← Ops utilisateur
├── PROMPT.md                 ← Prompt architecte original
├── PLAN.md                   ← Plan d'exécution
├── PLAN_THEMATIQUE.md        ← Thèmes détaillés
├── TRACKER.md                ← CE FICHIER
├── audit.md                  ← Audit architectural
└── CHANGELOG.md              ← Log des modifications
```

---

## Todo list globale — Restructuration Aura

> Les anciens thèmes (Split Déploiement, Dashboard, Hono, Standardisation DX) sont terminés ou intégrés dans la nouvelle architecture. Voir CHANGELOG.md pour l'historique.

### Phase 0 — Contrats & Fondations (PLAN.md §Phase 0)
- [x] Définir `AuraPlugin` contract dans `packages/core/src/plugin.ts` ✅
- [x] Définir `AuraRuntime` dans `packages/core/src/runtime.ts` ✅
- [x] Définir `AuraContext` minimal + `ContextExtension` pattern ✅
- [x] Définir `AuraOperation`, `Registry`, `Manifest` types stables ✅
- [x] Définir `AuraError`, `Envelope` types stables ✅
- [x] Créer structure `packages/core/` ✅
- [x] Créer stubs `packages/server-hono/`, `client-react/`, `prisma/`, `cli/`, `plugins/` ✅
- [x] Supprimer tout import `@/generated/prisma/client` du core ✅
- [x] Supprimer tout import React du core (aucun dans core/) ✅
- [x] Supprimer tout import Hono du core (aucun dans core/) ✅
- [x] Mettre à jour `tsconfig.base.json` avec les paths des nouveaux packages ✅

### Phase 1 — Core Runtime (PLAN.md §Phase 1)
- [x] Migrer `operation.ts` → `packages/core/src/operation.ts` (builder complet, générique, sans auto-registration) ✅
- [x] Migrer `registry.ts` → `packages/core/src/registry.ts` (InMemoryRegistry + capabilities) ✅
- [x] Migrer `runner.ts` → `packages/core/src/runner.ts` (pur, sans EventBus/metrics/invalidation) ✅
- [x] Créer config loader + validation plugin (`packages/core/src/config.ts`) ✅
- [x] Mettre à jour le barrel `packages/core/src/index.ts` ✅

### Phase 2 — Adapters (PLAN.md §Phase 2)
- [ ] Créer `@aura/server-hono` (adapter Hono)
- [ ] Créer `@aura/prisma` (adapter DB)
- [ ] Créer `@aura/client-react` (adapter frontend)

### Phase 3 — Plugins Officiels (PLAN.md §Phase 3)
- [ ] Auth (`@aura/auth`)
- [ ] Storage (`@aura/storage`)
- [ ] Cron (`@aura/cron`)
- [ ] Workflows (`@aura/workflows`)
- [ ] HTTP Actions (`@aura/http-actions`)
- [ ] Realtime (`@aura/realtime`)
- [ ] Observability (`@aura/observability`)
- [ ] Dashboard (`@aura/dashboard`)
- [ ] AI (`@aura/ai`)
- [ ] Search Postgres (`@aura/search-postgres`)
- [ ] Vector pgvector (`@aura/vector-pgvector`)
- [ ] Pagination Prisma (`@aura/pagination-prisma`)

### Phase 4 — Tooling & DX (PLAN.md §Phase 4)
- [ ] Créer `@aura/cli` avec `aura init`, `aura dev`, `aura make`, `aura doctor`
- [ ] Rendre discovery extensible par plugins
- [ ] CLI generators via plugins

### Phase 5 — Nettoyage (PLAN.md §Phase 5)
- [ ] Supprimer `packages/aura/` (ancien monolithe)
- [ ] Mettre à jour scripts racine et Dockerfiles
- [ ] Stabiliser `AuraPlugin` contract en v1.0

---

## État actuel

| Session | Action | Statut | Commit |
|---------|--------|--------|--------|
| 2026-05-24 | Phase 0-5: Monorepo setup + features MVP | ✅ | Historique |
| 2026-05-25 | Thème 3: Auth middleware Hono (internal secret, api key) | ✅ | `301afb3` |
| 2026-05-25 | Docs: Audit architectural complet (audit.md) | ✅ | `304d91a` |
| 2026-05-25 | Docs: Restructuration — PROMPT.md, PLAN.md, PLAN_THEMATIQUE.md, TRACKER.md | ✅ | `4043016` |
| 2026-05-25 | Phase 0: Contrats + packages/core/ + stubs + stripping imports | ✅ | `d566684` |
| 2026-05-25 | Phase 1: Core Runtime (operation, registry, runner, config) | 🚧 | *(courant)* |

## Prochaine action

**Phase 2 — Adapters (server-hono, prisma, client-react) :**
1. Créer `@aura/server-hono` avec `createHonoApp(runtime)`
2. Créer `@aura/prisma` avec injection PrismaClient dans le runtime
3. Créer `@aura/client-react` avec hooks React Query purs
4. Migrer les routes Hono (bridge, internal, files, health, http-actions)
5. Migrer middleware (auth, csrf, rate-limit, cors, logger)

---

## Décisions d'architecture (contraignantes)

| # | Décision | Raison |
| D1 | ~~Monorepo pnpm workspaces~~ → **DEPRECATED** Utiliser Bun workspaces | `bun` est le runtime unique. |
| D2 | ~~Routes code-based (pas file-based)~~ → **DEPRECATED** Utiliser file-based avec routeTree.gen.ts | TanStack Start nécessite le route tree. |
| D3 | ~~Aura est un workspace package (pas npm publish)~~ → **DEPRECATED** Aura devient une plateforme runtime publiée en packages npm | Pour permettre les plugins communautaires. |
| D4 | ~~Hono est le socle HTTP~~ → **DEPRECATED** Hono est un adapter optionnel | Le core doit fonctionner sans Hono. |
| D5 | ~~Dashboard = SPA servie par Hono~~ → **DEPRECATED** Dashboard = plugin `@aura/dashboard` | Pas dans le core. |
| D6 | ~~EventBus in-memory (pas de DB)~~ → **DEPRECATED** Observability = plugin `@aura/observability` | Pas dans le core. |
| D7 | ~~Dashboard frontend = vanilla JS~~ → **DEPRECATED** Dashboard = plugin officiel | Sera migré quand le dashboard deviendra plugin. |
| D8 | **NOUVEAU** Aura = plateforme runtime, pas framework monolithique | Extensibilité communautaire. |
| D9 | **NOUVEAU** Core minimal = `@aura/core` (runtime, contrats, plugin host) | Tout le reste est plugin ou adapter. |
| D10 | **NOUVEAU** `AuraPlugin` = contrat unique pour plugins officiels ET communautaires | Même mécanisme, pas de citoyens de seconde classe. |
| D11 | **NOUVEAU** Prisma = adapter `@aura/prisma`, pas core | Le core ne connaît pas la DB. |
| D12 | **NOUVEAU** React = adapter `@aura/client-react`, pas core | Le core ne connaît pas le frontend. |
| D13 | **NOUVEAU** Runner pur = sans observability, sans invalidation, sans broadcast | Les plugins souscrivent aux événements du runtime. |

---

## Conventions

- Chaque phase = 1+ commits signés
- Message de commit: `phase N: description (détails)`
- CHANGELOG.md mis à jour à chaque phase
- TRACKER.md mis à jour à chaque changement de statut
- Ne JAMAIS supprimer une décision — la marquer comme `DEPRECATED` avec la nouvelle motivation
- **Aucun wrapper legacy permanent** — supprimer, réécrire, casser la compatibilité.
- **Aucun alias temporaire long terme** — les breaking changes sont volontaires.
- **Plugins first-class** — officiels et communautaires utilisent le même contrat.
