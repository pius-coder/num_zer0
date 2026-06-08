# Phase 3 — Recherche Interne

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** Subagent recherche
**Objectif:** Phase 3 selon TEMPLATE.md — sources internes, règles applicables, implications refonte no-legacy

---

## Sources consultées

### Skills du projet

| Source | Raison | Contenu clé |
|--------|--------|-------------|
| `.agents/skills/convex-migration-helper/SKILL.md` | Schéma breaking changes — widen → migrate → narrow | Workflow multi-deploy, préférer nouveaux champs, `@convex-dev/migrations`, dry-run obligatoire, ne pas delete sans certitude |
| `.agents/skills/convex-migration-helper/references/migration-patterns.md` | Patterns concrets pour champs requis/suppression/type change | Dual write préféré, split table, cleanup orphelins, small table shortcut |
| `.agents/skills/convex-migration-helper/references/migrations-component.md` | Setup + usage du component migrations | `convex.config.ts` + `migrations.ts`, `migrateOne`, `batchSize`, `customRange`, `parallelize`, resume |
| `.agents/skills/tanstack-query-best-practices/SKILL.md` | Patterns React Query critiques pour mutations | Query key factories, `mut-optimistic-updates`, `mut-invalidate-queries`, `mut-mutation-state`, `qk-factory-pattern` |
| `.agents/skills/tanstack-query-best-practices/rules/mut-optimistic-updates.md` | Optimistic updates pattern | Cache manipulation + rollback + `onSettled` invalidation. **Actuellement non utilisé dans les hooks paiement** |
| `.agents/skills/tanstack-query-best-practices/rules/qk-factory-pattern.md` | Query key factories | `todoKeys.all`, `todoKeys.detail(id)`, etc. Pattern déjà existant (`purchaseKeys`, `activationKeys`, `adminKeys`) |
| `.agents/skills/tanstack-integration-best-practices/SKILL.md` | Router + Query integration | `defaultPreloadStaleTime: 0`, QueryClient per-request, `setupRouterSsrQueryIntegration` |
| `.agents/skills/tanstack-integration-best-practices/rules/setup-query-client-context.md` | QueryClient via router context | Pattern déjà en place dans `router.tsx` |
| `.agents/skills/tanstack-integration-best-practices/rules/cache-single-source.md` | Cache Query unique | Router deferre au Query cache — implication pour staleTime des nouvelles queries wallet/ledger |
| `.agents/skills/tanstack-integration-best-practices/rules/flow-loader-query-pattern.md` | Loader + `ensureQueryData` | Pattern à appliquer pour les nouvelles routes wallet/admin en SSR |

### Fichiers projet

| Source | Raison |
|--------|--------|
| `AGENTS.md` | Conventions projet — max 200 lignes, feature folder pattern, hooks vs inline, Convex + Query pattern |
| `issues/TEMPLATE.md` | Workflow obligatoire 8 phases, règles de persistance, multi-subagents |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/01-exploration.md` | Phase 1 consolidée — 54 fichiers impactés, 8 risques globaux |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/01-exploration-backend.md` | 22 fichiers couverts, architecture flux as-is, 6 problèmes majeurs |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/01-exploration-frontend.md` | 43 fichiers frontend, dépendances Convex legacy, risques max-lines |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/02-lecture.md` | Phase 2 consolidée — 10 modules backend, 10 modules frontend, éléments legacy listés |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/02-lecture-backend.md` | Lecture détaillée backend — races conditions, double confirmation, escrow non idempotent, 9 éléments supprimables |
| `issues/ISSUE-013-payment-wallet-escrow-refonte/02-lecture-frontend.md` | 20 hooks, 34 query keys, 17 mutations, invalidations, éléments réutilisables/supprimables |
| `src/components/recharge/docs/CONTINUE.md` | État recharge — style landing, 2 étapes, rate XAF hardcodé 600 |
| `src/components/recharge/docs/TODOS.md` | 11 tâches — restyling fait, URL search params non implémenté |
| `src/components/recharge/docs/CHANGELOG.md` | Restyling landing 2026-06-03 |
| `src/components/my-space/docs/CONTINUE.md` | Refacto SPA→routes TanStack, legacy SPA encore présent (1162 lignes), `convexAction` type issue |
| `src/components/my-space/docs/TODOS.md` | 6 cleanup restants, legacy SPA files à supprimer |
| `src/components/admin/docs/CONTINUE.md` | Dashboard admin 8 modules, pas de pagination, pas de lignes détaillées par pièce |
| `src/components/admin/docs/TODOS.md` | 25 tâches cochées, 7 améliorations futures |

### Issues structurées existantes (pattern)

| Source | Observation |
|--------|-------------|
| `issues/ISSUE-010-admin-dashboard-complet/03-recherche.md` | Format terse — liste bullet avec source + raison. Référence AGENTS.md, skills TanStack, common/ui, patterns exacts |
| `issues/ISSUE-012-my-space-refactoring/03-recherche.md` | Tableau skills + fichiers projet. Concepts clés retenus (6 items). Utilise `beforeLoad + redirect`, `ensureQueryData`, `queryOptions` |
| `issues/ISSUE-009-api-driven-pricing/03-recherche.md` | Doc API sms-online.pro détaillée, skills TanStack, env vars, sms_countries, ARCHITECTURE.md |

---

## Règles applicables

### Convex Migration Helper

1. **Widen → Migrate → Narrow**: Toute modification de schéma (suppression `users.balanceUsd`, `comptes`, `pieces`, `lignes`, `purchases`, `packages`) doit suivre ce workflow multi-deploy.
2. **Dual write préféré**: Pendant la migration, écrire à la fois dans l'ancien et le nouveau système pour permettre rollback.
3. **`@convex-dev/migrations` obligatoire**: Pour les tables avec données existantes (`comptes`, `pieces`, `purchases`, `activations`), utiliser le component migrations avec `batchSize` adapté.
4. **Dry-run avant chaque run**: `npx convex run migrations:myMigration '{"dryRun": true}'`.
5. **Ne pas delete sans certitude**: Marquer les champs `v.optional` avec commentaire deprecated avant suppression.
6. **Split table pattern**: `comptes` + `pieces` + `lignes` → `wallets` + `wallet_ledger_entries` — utiliser le pattern "splitting nested data into a separate table".
7. **Small table shortcut**: `packages` (quelques docs) peut être migré en une seule `internalMutation` sans component.

### TanStack Query Best Practices

1. **Query Key Factories**: Pattern existant (`purchaseKeys`, `activationKeys`, `adminKeys`) — la refonte doit créer des factories équivalentes pour `walletKeys`, `paymentIntentKeys`, `orderKeys`, `escrowKeys`.
2. **Optimistic Updates (mut-optimistic-updates)**: Actuellement AUCUN hook paiement/wallet n'utilise `withOptimisticUpdate`. La refonte DOIT l'implémenter pour les mutations critiques (initiatePayment, completeActivation, cancelActivation) — l'UX en dépend.
3. **Invalidate on `onSettled`**: Pattern déjà utilisé — à reproduire pour les nouvelles mutations.
4. **Cache single source**: `defaultPreloadStaleTime: 0` déjà en place. Les nouvelles queries wallet doivent respecter ce pattern.
5. **StaleTime configurable**: Balance wallet → staleTime court (5-10s) ; historique ledger → staleTime long (30s-1min) ; payment_intents → staleTime 0 (réactif).
6. **`queryOptions` factory**: Pour intégration loader + composant, utiliser `queryOptions` comme pour `mySpaceQueries`.

### TanStack Integration Best Practices

1. **Loader + `ensureQueryData`**: Les routes wallet/admin refaites doivent utiliser ce pattern pour éliminer les loading waterfalls.
2. **QueryClient per-request**: Déjà en place dans `router.tsx`.
3. **SSR hydration**: `setupRouterSsrQueryIntegration` déjà configuré. Attention : les pages wallet (solde réactif) devraient garder `ssr: false`.
4. **Router deferre au Query**: Les nouvelles queries wallet/ledger doivent être consommées via `useSuspenseQuery`/`useQuery` dans les composants, pas via les returned loader data.

### AGENTS.md — Conventions Projet

1. **Max 200 lignes**: `step-topup.tsx` (234) et `purchase-panel.tsx` (357) en infraction — doivent être refactorés ou supprimés par la refonte.
2. **Feature folder pattern**: Les nouveaux composants wallet/payment/escrow doivent suivre `docs/ + hooks/ + composants + index.ts`.
3. **Hooks vs Inline**: Toute mutation financière complexe (initiatePayment, captureEscrow, refundEscrow) DOIT aller dans `hooks/` avec `useConvexMutation` + `withOptimisticUpdate`.
4. **Barrel exports**: Systématique — chaque nouveau dossier feature doit avoir `index.ts`.
5. **`#/` alias système**: Utiliser pour les imports.
6. **Types Convex**: Ne jamais utiliser `any` — les nouveaux types wallet/ledger/payment doivent être strictement typés.
7. **Auth**: Toujours `ctx.auth.getUserIdentity()` côté serveur, jamais de `userId` client trusté.

---

## Implications pour la refonte no-legacy

### 1. Schéma et migrations

**Suppression des tables legacy** (elles contiennent des données réelles) :

| Table | Données | Approche migration |
|-------|---------|--------------------|
| `users.balanceUsd` | Champ redondant, jamais lu | Widen : `v.optional()` → Migrate : patch à `undefined` → Narrow : supprimer du schéma |
| `comptes` | Comptes actifs (411-user, 471-escrow, 701-recharge, 702-sms-marge, 471-fournisseur) | Widen : ajouter tables `wallets` + `escrows` → Dual write → Migrate via `@convex-dev/migrations` → Narrow : déprécier `comptes` |
| `pieces` + `lignes` | Écritures comptables historiques | Widen : ajouter `wallet_ledger_entries` → Dual write → Migrate → Narrow : `v.optional()` sur les champs |
| `purchases` | Recharges Fapshi historiques | Widen : ajouter `payment_intents` + `orders` → Dual write → Migrate → Narrow |
| `packages` | 1 document (`recharge`) | Small table shortcut : backfill en `internalMutation` |

**Contrainte no-legacy** : Pas de backward compat → après migration + validation, les tables legacy sont supprimées (narrow définitif). Mais le skill recommande de NE PAS delete avant certitude — prévoir un déploiement d'observation après narrow.

### 2. Nouveau modèle de données

| Nouvelle table | Remplaçante | Clés |
|----------------|-------------|------|
| `wallets` | `comptes(411-user)` | `{ userId, balanceUsd, currency, createdAt, updatedAt }` — 1 wallet par user |
| `wallet_ledger_entries` | `pieces` + `lignes` | `{ walletId, amount, balanceBefore, balanceAfter, type (credit/debit), category, referenceId, referenceTable, description, metadata?, createdAt }` |
| `payment_intents` | `purchases` (flux Fapshi) | `{ userId, amount, currency, provider, providerTransactionId, status (union), idempotencyKey, metadata?, expiresAt, createdAt, updatedAt }` |
| `orders` | `purchases` (achats) | `{ userId, type (recharge|activation|rental), totalUsd, paymentIntentId?, status, createdAt }` |
| `escrows` | `comptes(471-escrow)` implicite | `{ userId, activationId, amountUsd, status (held|released|refunded), heldAt, releasedAt?, refundedAt? }` |
| `provider_operations` | Trace API SMS provider | `{ activationId, provider, operation, request?, response, status, attemptedAt }` (nouveau, pour traçabilité) |

### 3. Backend — Nouvelles fonctions Convex

| Domaine | Fonctions | Type |
|---------|-----------|------|
| **Payment Intents** | `createPaymentIntent`, `confirmPaymentIntent` (webhook), `verifyPaymentIntent` (callback), `cancelPaymentIntent` | action + mutation + internalMutation |
| **Wallets** | `getWalletBalance`, `creditWallet`, `debitWallet`, `getWalletLedger` | query + internalMutation + query |
| **Orders** | `createOrder`, `getOrders`, `getAllOrders` | mutation + query |
| **Escrows** | `holdEscrow`, `releaseEscrow`, `refundEscrow` | internalMutation (idempotent, avec `idempotencyKey`) |
| **Provider abstraction** | `initiatePayment(provider, args)`, `checkPaymentStatus(provider, transId)` | action — pattern strategy pour multi-provider |

**Patterns Convex à suivre** :
- Status en union typée (comme `activations.status`) — plus de strings libres
- `idempotencyKey` comme first-class citizen — vérifié AVANT chaque opération financière
- `scheduler.runAfter` pour les opérations provider (pattern existant dans `sms_provider.ts`)
- Écrire d'abord le statut, puis exécuter l'action externe, puis confirmer (pattern Outbox)
- `requireAdmin` via `ctx.auth.getUserIdentity()` + check `isAdmin` — pattern existant

### 4. Frontend — Nouveaux hooks

| Hook | Endpoint Convex | Pattern |
|------|----------------|---------|
| `useWalletBalance()` → `walletKeys.balance()` | `api.wallets.getBalance` | Query + `staleTime: 5s` |
| `useWalletLedger()` → `walletKeys.ledger()` | `api.wallets.getLedger` | Query + `staleTime: 30s` |
| `useOrders()` → `orderKeys.list()` | `api.orders.list` | Query |
| `useCreatePaymentIntent()` | `api.payment_intents.create` | Mutation avec **optimistic update** + `onSettled` invalidation wallet |
| `useCompletePayment()` | `api.payment_intents.verify` | Mutation avec optimistic update |
| `useHoldEscrow()` | `api.escrows.hold` | Mutation (interne) |
| `useReleaseEscrow()` | `api.escrows.release` | Mutation avec **optimistic update** sur le solde |
| `useAdminWallets()` | `api.wallets.listAll` | Query admin |
| `useAdminLedger()` | `api.wallet_ledger.listAll` | Query admin |
| `useAdminPaymentIntents()` | `api.payment_intents.listAll` | Query admin |

**Query keys factories à créer** :
```
walletKeys = { all, balance, ledger(id), ledgers }
paymentIntentKeys = { all, detail(id) }
orderKeys = { all, list, detail(id) }
escrowKeys = { all, detail(id) }
```

**Invalidations critiques** :
- `createPaymentIntent` → invalide `walletKeys.all` + `orderKeys.all`
- `verifyPaymentIntent` → invalide `paymentIntentKeys.all` + `walletKeys.balance()` + `walletKeys.ledger()`
- `releaseEscrow` → invalide `escrowKeys.all` + `walletKeys.balance()` + `walletKeys.ledger()`
- `refundEscrow` → invalide `escrowKeys.all` + `walletKeys.balance()`

### 5. Escrow — Élimination du pattern artisanal

**Problème actuel** : L'escrow est simulé via `createPiece(471-escrow)` avec des écritures comptables inversées. Pas de document dédié, pas d'idempotence, double refund possible.

**Solution no-legacy** : Table `escrows` avec état (`held|released|refunded`), clé d'idempotence, et opérations atomiques :
- `holdEscrow` vérifie le solde ET crée l'escrow ET débite le wallet dans une seule mutation
- `releaseEscrow` vérifie l'état `held`, crée l'entry ledger, passe à `released`
- `refundEscrow` vérifie l'état `held`, crédite le wallet, passe à `refunded`
- Impossible d'appeler release + refund sur le même escrow (guard atomique)

**Liens avec `sms_provider.ts`** : `initiateActivation` appelle `holdEscrow` au lieu de `createPiece`. `completeActivationAccounting` appelle `releaseEscrow`. `cancelActivation` appelle `refundEscrow`. Les mutations actuelles de `sms_provider.ts` sont conservées mais leur logique comptable est déléguée aux nouvelles fonctions escrow.

### 6. Comptabilité — Ledger remplace la partie double

**Problème actuel** : `comptes`, `pieces`, `lignes` simulent une comptabilité en partie double sans transactions atomiques, sans vérification debit=credit, avec N+1 queries.

**Solution no-legacy** : Table `wallet_ledger_entries` :
- Chaque entrée = une ligne (pas de décomposition pièce+lignes)
- `balanceBefore` et `balanceAfter` calculés automatiquement
- `referenceId` + `referenceTable` pour tracer l'origine
- Index composé `by_walletId_createdAt` pour requêtes efficaces
- **Pas de N+1** — une seule query avec `.withIndex()` suffit
- Admin : vue agrégée avec somme par type/catégorie

### 7. Admin — Nouvelles vues

| Vue actuelle | Remplacée par |
|-------------|---------------|
| `admin-accounting.tsx` (Comptes + Pièces) | `admin-wallets.tsx` (Wallets + Ledger) |
| `admin-purchases.tsx` (Purchases legacy) | `admin-payment_intents.tsx` + `admin-orders.tsx` |
| `admin-activations.tsx` (déjà ok) | Conserver + ajouter colonne escrow status |

### 8. Wallet — Refonte UI

**Composants à conserver** (twister) :
- `WalletBalanceCard`, `WalletBalanceTotal` — adapter à nouvelles API
- `WalletTransactionList`, `WalletTransactionItem` — nouveau type `WalletLedgerEntry`
- `WalletTransactionTabs`, `WalletTransactionEmpty`, `WalletCtaFooter` — UI pure

**Composants à remplacer** :
- `WalletPageShell` → nouveau data mapping `walletKeys.balance()` + `walletKeys.ledger()`
- `WalletPurchaseHistory` → nouveau `api.orders.list`
- `PendingPaymentBanner` → supprimer (retourne null)
- `WalletPaymentMethods` → supprimer (mock hardcodé)
- `WalletBalanceBreakdown` → supprimer ou implémenter

**Recharge** :
- `recharge-drawer.tsx` → remplacer `useInitiateDirectPay` par `useCreatePaymentIntent`
- `step-topup.tsx` → remplacer `XAF_RATE = 600` par taux dynamique (API ou config), refactorer < 200 lignes
- `step-method.tsx` → remplacer méthodes hardcodées par config dynamique
- `payment-methods.ts` → remplacer par config backend

**My-space** :
- `purchase-panel.tsx` → remplacer `initiateActivation` par nouveau flux (check wallet balance → hold escrow → activate), refactorer < 200 lignes
- `activation-detail.tsx` → remplacer `completeActivation` (release escrow) et `cancelActivation` (refund escrow) par nouvelles mutations
- Legacy SPA (`my-space-page.tsx` 1162 lignes) → supprimer

### 9. Taux de change XAF/USD

**Problème actuel** : `600` hardcodé dans `purchases.ts` (3 occurrences), `users.ts`, `step-topup.tsx`, `my-space/constants.ts`.

**Solution no-legacy** :
- Déplacer dans `convex/env.ts` ou une table `config` avec override admin
- Frontend utilise `api.config.getXafRate()` ou le taux est inclus dans `api.wallets.getBalance`
- Tous les montants en USD dans le système ; conversion XAF uniquement à l'affichage

### 10. Risques de la refonte

1. **Perte de données historiques** : `comptes`, `pieces`, `purchases` contiennent des données réelles. La migration doit les transporter dans les nouvelles tables avant suppression.
2. **Activations en cours** : Les escrows actifs (statut `en_attente`) ne doivent pas être perdus pendant la migration. Prévoir une migration des `activations` en cours avec leur escrow.
3. **Double écriture** : Pendant le widen, les deux systèmes (ancien + nouveau) cohabitent. Risque d'incohérence si un webhook Fapshi arrive sur l'ancien système après le début de la migration.
4. **Fapshi lock-in** : `purchases.ts` est couplé à Fapshi. La refonte doit abstraire le provider tout en gardant la compatibilité avec Fapshi (webhook, retour utilisateur). Impossible de couper Fapshi immédiatement.
5. **Tests** : Aucun test automatisé n'a été trouvé. La refonte sans tests est risquée. Au minimum, tester les cycles complets : recharge → wallet crédité, activation → escrow → release/refund.
6. **Race condition webhook + callback** : Le nouveau `payment_intents` doit avoir un vrai guard idempotent (vérification d'état atomique + idempotencyKey avec contrainte unique).
7. **`sms_provider.ts` dépendances** : 1231 lignes, étroitement couplé à l'escrow legacy. La refonte doit impacter ce fichier sans le réécrire entièrement — extraire l'escrow dans les nouvelles tables, garder la logique provider.

### 11. Synthèse des patterns à reproduire

| Pattern | Source | À appliquer |
|---------|--------|-------------|
| Union typée pour status | `activations.status` (8 literals) | `payment_intents.status`, `escrows.status`, `orders.status` |
| Index composé | `by_userId_status` | `wallets` + `wallet_ledger` + `payment_intents` |
| `onSettled` invalidation | Tous les hooks actuels | Toutes les nouvelles mutations |
| `queryOptions` factory | `mySpaceQueries` | `walletQueries`, `paymentIntentQueries`, `orderQueries`, `escrowQueries` |
| Barrel + docs + feature folder | AGENTS.md + exemples | Chaque nouveau feature (wallet, payment, escrow) |
| Loader + `ensureQueryData` | TanStack integration skill | Routes wallet + admin refaites |
| Mutation → scheduler → action | `sms_provider.ts` (initiateActivation) | `createPaymentIntent` → poll → confirm |
| `useConvexMutation` + `withOptimisticUpdate` | AGENTS.md (recommandé, pas encore utilisé) | Toutes les mutations financières |
| `requireAdmin` manuel | `users.ts:getAllUsers` | Toutes les nouvelles queries admin |
| `internalMutation` pour ops internes | Pattern Convex standard | Toutes les ops escrow + wallet + ledger |
| Auth via `ctx.auth.getUserIdentity()` | Convex best practices + AGENTS.md | Toutes les nouvelles queries/mutations financières |

---

*Rapport généré par subagent recherche — Phase 3 du workflow TEMPLATE.md.*
*Prochaine étape : Phase 4 — Analyse profonde (root cause + edge cases).*
