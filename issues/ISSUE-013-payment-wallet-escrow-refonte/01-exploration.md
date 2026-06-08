# Phase 1 — Exploration consolidée

**Issue:** ISSUE-013-payment-wallet-escrow-refonte  
**Date:** 2026-06-08  
**Agents utilisés:** 2 agents `explore`

Rapports bruts associés :

- `01-exploration-backend.md` — backend Convex, paiements, wallet, escrow, comptabilité.
- `01-exploration-frontend.md` — hooks, UI recharge/wallet, routes, admin, docs.

---

## Fichiers Impactés

| Fichier | Intervalle | Rôle dans l'issue |
|---|---:|---|
| `/home/ubuntu/num_zer0/convex/schema.ts` | L1-L135 | Schéma des tables legacy `users`, `purchases`, `comptes`, `pieces`, `lignes`, `activations` à remplacer ou migrer. |
| `/home/ubuntu/num_zer0/convex/purchases.ts` | L1-L507 | Flux Fapshi, webhook/retour utilisateur, confirmation, promo, écriture comptable recharge. |
| `/home/ubuntu/num_zer0/convex/comptabilite.ts` | L1-L251 | Comptabilité artisanale utilisée comme wallet et escrow. |
| `/home/ubuntu/num_zer0/convex/http.ts` | L1-L51 | Webhook `/fapshi-webhook`. |
| `/home/ubuntu/num_zer0/convex/users.ts` | L1-L279 | Source actuelle du solde affiché via `comptes(411-user).solde`. |
| `/home/ubuntu/num_zer0/convex/auth.ts` | L1-L105 | Sync BetterAuth, création de `users.balanceUsd`. |
| `/home/ubuntu/num_zer0/convex/sms_provider.ts` | L1-L1231 | Activations SMS, locations, escrow, refund, capture, provider polling. |
| `/home/ubuntu/num_zer0/convex/margins.ts` | L1-L64 | Overrides de marge, impact pricing. |
| `/home/ubuntu/num_zer0/convex/margin_tiers.ts` | L1-L48 | Calcul de marge par défaut, impact pricing. |
| `/home/ubuntu/num_zer0/convex/packages.ts` | L1-L69 | Packages de recharge legacy. |
| `/home/ubuntu/num_zer0/convex/promo_codes.ts` | L1-L76 | Codes promo utilisés par la recharge. |
| `/home/ubuntu/num_zer0/src/components/purchases/hooks/use-purchases.ts` | L1-L68 | Hooks balance, mouvements, purchases, paiement direct, vérification. |
| `/home/ubuntu/num_zer0/src/components/purchases/hooks/use-activations.ts` | L1-L141 | Hooks activations SMS, completion, annulation, prix provider. |
| `/home/ubuntu/num_zer0/src/components/purchases/hooks/index.ts` | L1-L27 | Barrel des hooks paiement/activations. |
| `/home/ubuntu/num_zer0/src/components/recharge/recharge-drawer.tsx` | L1-L56 | Drawer de recharge branché sur `initiateDirectPay`. |
| `/home/ubuntu/num_zer0/src/components/recharge/step-topup.tsx` | L1-L234 | Formulaire recharge, taux XAF hardcodé, dépasse 200 lignes. |
| `/home/ubuntu/num_zer0/src/components/recharge/step-method.tsx` | L1-L57 | Sélection des méthodes de paiement. |
| `/home/ubuntu/num_zer0/src/components/recharge/payment-methods.ts` | L1-L32 | Méthodes paiement hardcodées. |
| `/home/ubuntu/num_zer0/src/components/wallet/wallet-page-shell.tsx` | L1-L55 | Orchestrateur wallet, balance et mouvements comptables. |
| `/home/ubuntu/num_zer0/src/components/wallet/wallet-purchase-history.tsx` | L1-L68 | Historique des recharges legacy. |
| `/home/ubuntu/num_zer0/src/components/wallet/wallet-transaction-list.tsx` | L1-L110 | Interface `TransactionItem` et affichage mouvements. |
| `/home/ubuntu/num_zer0/src/routes/payment/result.tsx` | L1-L171 | Callback paiement et vérification front. |
| `/home/ubuntu/num_zer0/src/routes/(app)/recharge.tsx` | L1-L26 | Route recharge. |
| `/home/ubuntu/num_zer0/src/routes/(app)/wallet.tsx` | L1-L7 | Route wallet. |
| `/home/ubuntu/num_zer0/src/components/my-space/purchase-panel.tsx` | L1-L357 | Achat SMS/location, vérification solde locale, déclenchement escrow. |
| `/home/ubuntu/num_zer0/src/components/my-space/activation-detail.tsx` | L1-L132 | Actions terminer/annuler activation qui capturent ou remboursent l'escrow. |
| `/home/ubuntu/num_zer0/src/components/admin/hooks/use-admin-queries.ts` | L1-L144 | Hooks admin purchases/comptes/pieces. |
| `/home/ubuntu/num_zer0/src/components/admin/accounting/admin-accounting.tsx` | L1-L121 | UI admin comptabilité legacy. |
| `/home/ubuntu/num_zer0/src/components/admin/purchases/admin-purchases.tsx` | L1-L76 | UI admin purchases legacy. |
| `/home/ubuntu/num_zer0/src/components/recharge/docs/CONTINUE.md` | L1-L26 | État courant recharge. |
| `/home/ubuntu/num_zer0/src/components/recharge/docs/TODOS.md` | L1-L11 | TODO recharge. |
| `/home/ubuntu/num_zer0/src/components/recharge/docs/CHANGELOG.md` | L1-L13 | Historique recharge. |
| `/home/ubuntu/num_zer0/src/components/my-space/docs/CONTINUE.md` | L1-L47 | État courant my-space, legacy SPA encore présent. |
| `/home/ubuntu/num_zer0/src/components/my-space/docs/TODOS.md` | L1-L52 | Cleanup my-space restant. |
| `/home/ubuntu/num_zer0/src/components/admin/docs/CONTINUE.md` | L1-L39 | État courant admin. |
| `/home/ubuntu/num_zer0/issues/TEMPLATE.md` | L1-L495 | Workflow obligatoire. |
| `/home/ubuntu/num_zer0/AGENTS.md` | L1-L232 | Règles projet, Convex, TanStack, max 200 lignes. |

---

## Risques Globaux

- Le solde utilisateur a deux sources : `users.balanceUsd` et `comptes(411-user).solde`.
- La comptabilité sert de wallet, ce qui rend les écritures non standard et difficiles à auditer.
- Le paiement Fapshi peut être confirmé par webhook ou par retour utilisateur, avec risque de duplication.
- L'escrow est implicite dans `pieces/lignes`, sans table dédiée ni état idempotent.
- Les montants utilisent des `number` flottants et un taux XAF/USD hardcodé.
- Les statuts sont des strings libres.
- L'admin affiche des comptes/montants sans typage strict et avec unités ambiguës.
- Deux fichiers dépassent la limite projet : `step-topup.tsx` et `purchase-panel.tsx`.

---

## Conclusion Phase 1

La refonte doit traiter le système comme un domaine financier complet : `payment_intents`, `wallets`, `wallet_ledger_entries`, `orders`, `escrows`, `provider_operations`, et vues admin dédiées. Le code actuel ne doit pas être patché partiellement si l'objectif reste no-legacy.
