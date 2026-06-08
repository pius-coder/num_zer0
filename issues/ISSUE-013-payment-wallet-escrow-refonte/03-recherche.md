# Phase 3 — Recherche (Consolidé)

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08

## Sources consolidées

| Source | Type | Contenu clé |
|--------|------|-------------|
| docs.fapshi.com | Externe | API Initiate Pay, Direct Pay, Payment Status, Webhook, Expire Pay |
| sms-online.pro/docs/api | Externe | Get Number, Set Status (1/3/6/8), Get Status, Get Balance, Get Prices, Rent API |
| docs.stripe.com/api/idempotent_requests | Externe | Pattern idempotence Stripe |
| moderntreasury.com | Externe | State machine + idempotency en paiement |
| naya.finance | Externe | Double-entry ledger schema design |
| docs.convex.dev/production/state/limits | Externe | Limites Convex (1s mutation, 32000 scan, 16000 write) |
| AGENTS.md | Interne | Conventions projet, feature folder, hooks vs inline, max 200 lignes |
| issues/TEMPLATE.md | Interne | Workflow 8 phases, règles persistance, multi-subagents |
| .agents/skills/convex-migration-helper/SKILL.md | Interne | Widen → migrate → narrow, @convex-dev/migrations |
| .agents/skills/convex-performance-audit/SKILL.md | Interne | Hot path, OCC, subscription cost, function budget |
| .agents/skills/convex-setup-auth/SKILL.md | Interne | ctx.auth.getUserIdentity(), pas de userId client |
| .agents/skills/tanstack-query-best-practices/SKILL.md | Interne | Query key factories, optimistic updates, invalidation |
| .agents/skills/tanstack-integration-best-practices/SKILL.md | Interne | Router + Query integration, ensureQueryData |
| rapports phases 1-2 | Interne | 54 fichiers impactés, 12 défauts structurels |

## Résultats clés

### Architecture cible validée (6 patterns)

1. **Payment Intents** — Stripe-like, découplé du provider, statuts typés, idempotency key
2. **Wallet + Ledger immuable** — Double-entry simplifié, cents entiers, balance dérivable, jamais UPDATE
3. **State machine** — Status en union typée (pas de strings libres), transitions protégées
4. **Idempotence** — Check-before-write atomique (atomicité mutation Convex), clé unique par opération
5. **Escrow explicite** — Table dédiée avec état held→released/refunded/partially_released
6. **Provider abstraction** — Gateway pattern (Fapshi encapsulé), provider_operations table pour audit

### Modèle de données cible

| Table | Remplace | Rôle |
|-------|----------|------|
| `wallets` | `comptes(411-user)` + `users.balanceUsd` | 1 wallet/user, balanceCents cache |
| `wallet_ledger_entries` | `pieces` + `lignes` | Entrées immuables, balanceAfterCents snapshot |
| `payment_intents` | `purchases` | Flux Fapshi, statuts typés, idempotent |
| `escrows` | `comptes(471-escrow)` implicite | Escrow dédié, machine à états |
| `orders` | `purchases` (historique) | Vue métier des recharges/achats |
| `provider_operations` | (nouveau) | Trace API externes |

### Règles Convex backend (10 règles)

1. Domaines purs, tables dédiées — montants en cents entiers
2. Idempotence check-before-write atomique dans chaque mutation
3. Une mutation = une transaction ledger atomique (pas de boucle for comme legacy)
4. Escrow machine à états, transitions protégées, mutuellement exclusives
5. Migration 3 phases : widen (tables ajoutées) → migrate (données actives) → narrow (legacy supprimé)
6. Pagination obligatoire sur ledger, pas de Date.now() dans queries
7. Auth via requireAuth/requireAdmin côté serveur, actions sans auth → internalMutation
8. Risques perf : hot read wallet, OCC conflict, croissance unbounded ledger, hot document promo
9. Gateway abstraction provider paiement, webhook unique dispatché par gateway
10. Vérification intégrité ledger post-déploiement (somme, orphelins, doubles)

### Règles frontend (7 recommandations)

1. Créer factory `walletKeys` unifiée remplaçant 3 factories dispersées
2. `useConvexMutation` partout (pas `useConvexAction` pour mutations)
3. Ajouter `withOptimisticUpdate` sur toutes les mutations financières
4. Invalidation ciblée par hiérarchie (pas de `.all` systématique)
5. Refactorer `purchase-panel.tsx` (>357→<200) et `step-topup.tsx` (>234→<200)
6. Créer feature docs lifecycle pour wallet (docs/, hooks/)
7. Supprimer/remplacer : PendingPaymentBanner, WalletPaymentMethods mocks, XAF_RATE hardcodé

### Risques migration (7 identifiés)

1. Perte données historiques si migration incomplète
2. Activations en cours avec escrows actifs à préserver
3. Double écriture pendant widen → risque incohérence
4. Fapshi lock-in impossible à couper immédiatement
5. Aucun test automatisé trouvé
6. Race condition webhook + callback = vrai guard idempotent nécessaire
7. sms_provider.ts (1231 lignes) étroitement couplé à l'escrow legacy
