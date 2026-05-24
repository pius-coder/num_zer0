# Aura — Tracker d'Avancement

> Fichier source de vérité pour reprendre le travail après un reset de contexte.
> Chaque session lit ce fichier pour savoir exactement où on en est.

---

## Architecture (source de vérité)

```
num_zer0/                                  ← Monorepo racine
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
│       │   │   ├── dashboard/             ← Dashboard (logs, metrics, event-bus)
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
│       │   │   ├── index.ts               ← Exports publics
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
│       ├── package.json                   ← @aura-js/core
│       └── tsconfig.json
├── apps/
│   └── app/                              ← Projet utilisateur (num_zer0)
│       ├── src/
│       │   ├── app/
│       │   │   └── routes/               ← Routes TanStack (code-based)
│       │   ├── components/               ← Composants spécifiques app
│       │   ├── lib/                      ← Utilitaires app
│       │   ├── hooks/                    ← Hooks app
│       │   ├── operations/               ← Operations Aura
│       │   │   ├── _registry.ts
│       │   │   ├── system/
│       │   │   ├── todos/
│       │   │   ├── ai/
│       │   │   └── catalog/
│       │   ├── server.ts                 ← Entry point
│       │   ├── router.tsx                ← Router (code-based, PAS file-based)
│       │   ├── client.tsx                ← Client entry
│       │   ├── aura.registry.ts          ← Registry Aura
│       │   └── styles.css
│       ├── aura.config.ts
│       ├── components.json               ← shadcn config
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── tailwind.config.ts
├── package.json                          ← Root workspace (pnpm workspaces)
├── pnpm-workspace.yaml                   ← Workspace config
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
- [ ] Créer `src/server-hono.ts` (entrypoint backend standalone)
- [ ] Configurer `build:backend` (tsup)
- [ ] Configurer `build:frontend` (vite)
- [ ] Ajouter RouteRules Nitro pour proxy en prod
- [ ] Créer Dockerfile.backend
- [ ] Créer Dockerfile.frontend
- [ ] Configurer variables d'environnement (.env.production)

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
- [ ] Middleware stack (auth, cors, rate-limit, logging)
- [ ] Routes dashboard

### Thème 4 — Standardisation DX (PLAN.md)
- [ ] Phase 1: Builders (defineAgent, defineDbReadFn, etc.)
- [ ] Phase 2: Client hooks (useQuery, useMutation, callables)
- [ ] Phase 3: Nettoyage (anciens exports, tests)

### Monorepo Migration
- [x] Phase 0: TRACKER.md + CHANGELOG.md
- [ ] Phase 1: Structure monorepo
- [ ] Phase 2: packages/aura
- [ ] Phase 3: apps/app
- [ ] Phase 4: Wiring + test
- [ ] Phase 5: Cleanup

---

## État actuel

| Session | Action | Statut | Commit |
|---------|--------|--------|--------|
| 2026-05-24 | Phase 0: système tracking | ✅ | `3c495af` |
| 2026-05-24 | Phase 1-3: monorepo + migration framework + app | ✅ | `1550ab3` |
| 2026-05-24 | Phase 4: wiring + test dev server | ✅ | *(en cours)* |

## Prochaine action

**Phase 5** : Nettoyage
1. Supprimer `ref/` directory
2. Supprimer `tmp/` directory
3. Commit + push final

---

## Décisions d'architecture (contraignantes)

| # | Décision | Raison |
|---|----------|--------|
| D1 | Monorepo pnpm workspaces (pas npm/nx/turborepo) | Léger, natif, pas de dépendance build |
| D2 | Routes code-based (pas file-based) | Choix utilisateur |
| D3 | Aura est un workspace package (pas npm publish) | Dev local, pas de registre |
| D4 | Hono est le socle HTTP | Portable, standard Web, déjà existant |
| D5 | Dashboard = SPA servie par Hono | Indépendant du frontend principal |
| D6 | EventBus in-memory (pas de DB) | Assez pour MVP, pas de surcharge |

---

## Conventions

- Chaque phase = 1 commit signé
- Message de commit: `phase: <num> - <description>`
- CHANGELOG.md mis à jour à chaque phase
- TRACKER.md mis à jour à chaque changement de statut
- Ne JAMAIS supprimer une décision — la marquer comme `DEPRECATED` avec la nouvelle motivation
