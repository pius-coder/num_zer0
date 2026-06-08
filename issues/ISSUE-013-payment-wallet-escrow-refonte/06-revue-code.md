# Phase 6 — Revue du Code Existant (Agent 1)

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** Reviewer Agent 1 (revue-code)
**Périmètre:** 11 fichiers backend + frontend

---

## Résumé Exécutif

17 problèmes identifiés : 3 OK, 3 manquants, 4 changements obligatoires, 4 risques oubliés, 2 dépendances cachées, 1 contrat d'interface critique. Le plan est solide mais sous-estime la complexité du flux `sms_provider.ts` et oublie plusieurs consommateurs frontend.

---

## 1. Ce qui est OK — Patterns à reproduire

### ✓ 1.1 Query key factory pattern (`use-purchases.ts:5-10`)

`purchaseKeys` utilise une factory avec scope hiérarchique (`all → purchases/balance/mouvements`). Ce pattern est correct et doit être reproduit dans `walletKeys`, `escrowKeys`, etc.

### ✓ 1.2 Internal mutations pour les écritures DB depuis les actions (`purchases.ts:171-231`)

`internalCreatePurchase`, `internalPatchPurchase`, `internalGetPurchaseByGatewayId` sont correctement typées en `internalMutation`/`internalQuery`. Ce pattern est suivi par le plan (Step 5). Bon point : le plan a corrigé `expireOrphanedPaymentIntents` de `mutation` → `internalMutation`.

### ✓ 1.3 Action pour les appels HTTP externes (`purchases.ts:285-368, 370-452`)

`initiateDirectPay` et `verifyPurchase` sont des `action` car elles appellent `fetch()` vers Fapshi. C'est la règle Convex correcte. Le plan préserve ce pattern.

---

## 2. Ce qui manque — Fonctionnalités existantes non couvertes par le plan

### ✗ 2.1 `sms_provider.ts` RENT_DURATIONS_HOURS (ligne 713-744) — non migré

Le plan Step 18 (extraction `activations.ts`) ne mentionne pas ce tableau de 30+ entrées. Il est utilisé par `getRentPriceList` (ligne 750) et exporté comme `RENT_DURATIONS_HOURS`. Il doit être déplacé dans le nouveau module `activations.ts` ou `config.ts`. Si oublié, le module `getRentPriceList` sera cassé.

### ✗ 2.2 `users.ts` — 6 fonctions hors wallet non couvertes

| Fonction | Ligne | Usage | Risque si oubli |
|---|---|---|---|
| `getAccessStatus` | 30 | Frontend affiche état d'accès | UI cassée, utilisateur voit "expiré" |
| `completeDeposit` | 116 | Mutation indépendante marquant dépôt | Flux 48h cassé |
| `convertToPermanent` | 142 | Conversion anonyme → permanent | Comptes bloqués |
| `hasAccess` | 174 | Guard dans routes frontend | Routes refusées |
| `checkUserExists` | 195 | Formulaire login | UX login cassée |
| `deleteUser` | 261 | Admin | Supprime wallet sans guard (Edge Case 10) |

Le plan ne mentionne que `balanceUsd` et `hasMadeDeposit`. Les autres fonctions survivent, mais `syncUser` (ligne 62) crée `balanceUsd: 0` — si la table schema supprime ce champ, `syncUser` échoue. Plan Step 20 doit être coordonné.

### ✗ 2.3 `internalGetUserByBetterAuthId` + `internalCreateUser` + `internalUpdateUserDeposit` (`purchases.ts:242-283`)

Ces 3 fonctions sont appelées par `sms_provider.ts:659` (syncPrices admin vérification) et `verifyPurchase:440`. Elles sont dans `purchases.ts` qui sera supprimé (Step 19). Le plan ne dit pas où elles migrent. Proposition : les déplacer dans `users.ts` avant la suppression de `purchases.ts`.

---

## 3. Ce qui doit changer — Contraintes ignorées par le plan

### ✗ 3.1 `cancelActivation` appelle `refundEscrow` DEUX FOIS (`sms_provider.ts:434-464` + `cancelActivationAction:1225`)

**Constat:** `cancelActivation` (ligne 454) appelle `refundEscrow` DIRECTEMENT, puis schedule `cancelActivationAction` (ligne 458) qui appelle `refundEscrow` À NOUVEAU (ligne 1225). C'est un bug existant dans le code actuel.

**Implication pour le plan:** La machine à états escrow (Step 6) avec `internalRefundEscrow` idempotent empêchera le double refund (guard `status !== 'held'`). Mais `cancelActivationAction` fera quand même l'appel API SMS Online Pro (setStatus 8). Le plan doit supprimer l'appel `refundEscrow` dans `cancelActivation` (ligne 454) et le garder uniquement dans `cancelActivationAction` (ou vice-versa).

**Correction suggérée:** Dans le Step 18, ne garder `refundEscrow` QUE dans `cancelActivationAction`, pas dans `cancelActivation`.

### ✗ 3.2 `completeActivationAccounting` crée 3 lignes comptables (`sms_provider.ts:1155-1181`)

Le plan Step 18 remplace `completeActivationAccounting` par `releaseEscrow`. Mais le code legacy crée TROIS lignes:
- `471-escrow` (credit) → débloque l'escrow
- `702-sms-marge` (debit) → enregistre la marge
- `471-fournisseur` (debit) → enregistre la dette fournisseur

**Implication:** Le nouveau `internalReleaseEscrow` (Step 6) ne crée qu'une entry ledger type `'release'`. Il n'enregistre PAS la dette fournisseur (`471-fournisseur`). Si cette comptabilité fournisseur est nécessaire, le plan doit l'ajouter (soit dans `releaseEscrow`, soit dans une nouvelle table `provider_debts`).

**Correction suggérée:** Ajouter le suivi fournisseur dans `escrows.ts` via champ `providerCostCents` (déjà prévu dans le schema !). L'entry ledger `release` avec `amountCents = priceCharged - providerCost` devient le revenu (marge). Le `providerCostCents` est tracé mais pas écrit en double partie — c'est un choix délibéré de l'immutable ledger. À documenter.

### ✗ 3.3 `wallet-page-shell.tsx` mappe en XAF via `* 600` (ligne 21)

```typescript
amountXaf: Math.round(m.montant * 600),  // m.montant est en USD
```

Le legacy stocke les montants en USD (float). Le frontend convertit en XAF pour affichage. Les nouvelles `wallet_ledger_entries` stockent `amountCents` (cents USD entiers, pas flottants). Le mapping doit changer :
- Ancien: `amountXaf = Math.round(montant * 600)` avec montant USD float
- Nouveau: `amountXaf = Math.round(amountCents / 100 * 600)` ou directement utiliser `amountCents` en cents

**Implication:** Le plan Step 11 dit "adapter type TransactionItem pour WalletLedgerEntry" mais ne précise pas cette conversion XAF/USD. Le `TransactionItem` interface attend `amountXaf`, `credit`, `debit` — ces champs changent de sémantique.

### ✗ 3.4 `mobile-bottom-nav.tsx` et `recharge-panel.tsx` oubliés dans la liste des consommateurs

Le plan (Step 10) liste uniquement `recharge-drawer.tsx` comme consommateur de `useInitiateDirectPay`. Mais deux autres consommateurs existent :
- `src/components/layout/panels/recharge-panel.tsx:4` — utilise `useInitiateDirectPay`
- `src/components/layout/mobile-bottom-nav.tsx:6` — utilise `useInitiateDirectPay` ET `useBalance`

L'analyse (section 5.1) liste `RechargeDrawer` et `Navigation` comme consommateurs de `useBalance`, mais pas de `useInitiateDirectPay` pour ces deux.

---

## 4. Risques oubliés — Edge cases legacy non couverts par le plan

### ⚠ 4.1 `internalIncrementPromo` — hot document non adressé (`purchases.ts:233-240`)

L'analyse (Défaut 11, section 2.3) identifie le problème : `promoCodes.usedCount` est incrémenté directement, créant un hot document si le code promo est populaire. Le plan ne propose pas de solution. Si la refonte garde le même pattern dans `payment_intents.ts`, le problème persiste.

**Suggestion:** Remplacer par une table `promo_usage` avec entries individuelles, agrégées via index. Ou garder le compteur mais ajouter un cache/scheduler de mise à jour.

### ⚠ 4.2 `internalPatchPurchase` utilise `v.any()` (`purchases.ts:199`)

```typescript
export const internalPatchPurchase = internalMutation({
  args: { purchaseId: v.id('purchases'), patch: v.any() },
```

Ce bypass de validation est dangereux. Les nouvelles internal mutations (`internalMarkPaymentProcessing`, `internalMarkPaymentFailed`) dans le plan Step 5 ont des args typés — c'est mieux. Vérifier qu'aucun nouvel usage de `v.any()` n'est introduit.

### ⚠ 4.3 `sms_provider.ts` `syncPrices` action référence `internal.purchases.internalGetUserByBetterAuthId` (ligne 659)

Quand `purchases.ts` est supprimé (Step 19), cette référence casse. Le plan ne mentionne pas le déplacement de cette fonction utilitaire. Voir section 2.3.

### ⚠ 4.4 `backfillComptes` (`purchases.ts:468-507`) — supprimé mais utile pour la migration

Le plan Step 19 supprime `purchases.ts`. Mais `backfillComptes` est précisément le genre de fonction nécessaire pour la migration des anciennes purchases vers les nouvelles tables (Step 16). Il faudrait soit :
1. Garder `backfillComptes` jusqu'à la fin de la migration, OU
2. Réécrire `backfillComptes` en `backfillPaymentIntents` dans le module de migration (Step 16)

Actuellement le plan crée `backfill_payment_intents.ts` de toutes pièces (Step 16). La logique dans `backfillComptes` (iterer purchases, créer écritures) pourrait être réutilisée.

---

## 5. Dépendances cachées — Liens entre modules que le plan pourrait casser

### 🔗 5.1 Graphe de dépendances inter-modules Convex

```
purchases.ts ──→ comptabilite.ts (19 appels: ensureCompte, createPiece)
    │
    ├──→ users.ts   (internalGetUserByBetterAuthId, internalUpdateUserDeposit, internalCreateUser)
    │
    └──→ promoCodes (internalGetPromoCode, internalIncrementPromo)

sms_provider.ts ──→ comptabilite.ts (13 appels: ensureCompte, createPiece)
    │
    └──→ purchases.ts (internalGetUserByBetterAuthId dans syncPrices)

comptabilite.ts ──→ comptabilite.ts (self-reference: createPiece → creditCompte/debitCompte)

http.ts ──→ purchases.ts (api.purchases.handlePaymentSuccess, handlePaymentFailure)
```

**Impact:** `http.ts` appelle `api.purchases.handlePaymentSuccess` et `handlePaymentFailure`. Le plan Step 8 ajoute `/payment/webhook` qui appelle `confirmPaymentIntent`. Mais l'ancien endpoint `/fapshi-webhook` continue d'exister jusqu'au Step 19-20. Pendant la transition, les deux endpoints coexistent et appellent des mutations différentes. C'est intentionnel, mais il faut s'assurer que `handlePaymentSuccess` legacy est désactivé ou ne cause pas de double écriture.

### 🔗 5.2 Graphe des hooks frontend

```
use-purchases.ts (7 exports)
  ├── useBalance()       → api.users.getUserBalance
  ├── useMouvements()    → api.comptabilite.getMyMouvements
  ├── usePurchases()     → api.purchases.getPurchases
  ├── useInitiateDirectPay() → api.purchases.initiateDirectPay (action)
  ├── useVerifyPurchase() → api.purchases.verifyPurchase (action)
  ├── useCancelPurchase() → api.purchases.cancelPurchase (mutation)
  └── useValidatePromoCode() → api.purchases.validatePromoCode

Consommateurs:
  desktop-header.tsx:        useBalance
  mobile-bottom-nav.tsx:     useBalance, useInitiateDirectPay
  wallet-page-shell.tsx:     useBalance, useMouvements
  wallet-purchase-history:   usePurchases
  recharge-drawer.tsx:       useInitiateDirectPay
  recharge-panel.tsx:        useInitiateDirectPay
  payment/result.tsx:        useVerifyPurchase
  activation-detail.tsx:     useBalance
```

**Impact:** Le plan Step 21 supprime `use-purchases.ts` mais doit d'abord migrer TOUS ces consommateurs. La liste du plan (section 5.1 de l'analyse) en liste 5-6, mais on en trouve 8-9 uniques. `recharge-panel.tsx` n'est pas listé.

---

## 6. Contrats d'interface frontend-backend à préserver

### 📋 6.1 `useBalance()` → `{ balanceUsd: number, userId: string | null }`

| Fichier | Ligne | Usage |
|---|---|---|
| `desktop-header.tsx` | 13 | `balanceData?.balanceUsd ?? 0` |
| `wallet-page-shell.tsx` | 15 | `balanceData?.balanceUsd ?? 0` |
| `activation-detail.tsx` | 21 | `balanceData?.balanceUsd ?? 0` |
| `mobile-bottom-nav.tsx` | 384 | `balanceData?.balanceUsd ?? 0` |
| `purchase-panel.tsx` | 25 | `balanceUsd: number` (via props) |

**Contrat:** La nouvelle `useWalletBalance()` doit retourner un objet avec `balanceUsd: number` (même nom de champ) pour éviter de casser 5 consommateurs. Sinon, les 5 doivent être mis à jour individuellement. Recommandation : garder `balanceUsd` dans la réponse pour backward compat, ajouter `balanceCents` pour le nouveau code.

### 📋 6.2 `useMouvements()` → tableau de `{ id, libelle, date, montant, sens, soldeApres, statut }`

Transformé dans `wallet-page-shell.tsx:17-27` en `TransactionItem` :
```typescript
{
  id: m.id,
  label: m.libelle,
  date: m.date,
  amountXaf: Math.round(m.montant * 600),
  credit: m.sens === 'debit' ? m.montant : 0,
  debit: m.sens === 'credit' ? m.montant : 0,
  soldeApres: m.soldeApres,
  kind: 'purchase',
  statut: m.statut,
}
```

**Contrat:** La nouvelle `useWalletLedger()` doit soit retourner des données compatibles avec ce mapping, soit le mapping doit être réécrit. Les nouvelles `wallet_ledger_entries` ont `type` ('credit'|'debit'|'release'|'refund') au lieu de `sens`, et `amountCents` au lieu de `montant`. Le plan Step 11 doit explicitement réécrire ce mapping.

### 📋 6.3 `initiateDirectPay` → `{ success, transId, link, purchaseId }`

```typescript
// recharge-drawer.tsx:32
if (data.link) window.location.href = data.link
```

**Contrat:** La nouvelle `createPaymentIntent` (action) doit retourner un objet avec `link` (ou `checkoutUrl`) pour la redirection Fapshi. Si le nom du champ change (`checkoutUrl` au lieu de `link`), le frontend casse.

### 📋 6.4 `verifyPurchase` → `{ success, purchaseId?, status? }`

```typescript
// payment/result.tsx:57-68
onSuccess: (result) => {
  if (result.success) { ... }
  else { setVerificationStatus('failed') }
}
```

**Contrat:** La nouvelle `verifyPaymentIntent` doit retourner `{ success: boolean }` au minimum. Le champ `status` est utilisé pour le message d'erreur (ligne 64). Si `status` n'est plus présent, le message d'erreur est moins informatif.

---

## 7. Vérifications complémentaires recommandées

Avant d'appliquer le plan, ajouter ces vérifications :

1. **[grep]** `rg "api\.purchases\." src/ convex/ --include="*.{ts,tsx}" | grep -v _generated` — lister TOUS les consommateurs (pas seulement ceux de l'analyse)
2. **[grep]** `rg "api\.comptabilite\." src/ convex/ --include="*.{ts,tsx}" | grep -v _generated` — idem
3. **[grep]** `rg "XAF_RATE|XAF_TO_USD|XAF_USD_RATE" --include="*.{ts,tsx}"` — vérifier toutes les occurrences du taux
4. **[grep]** `rg "balanceUsd|hasMadeDeposit" src/ convex/ --include="*.{ts,tsx}"` — vérifier tous les usages des champs supprimés
5. **[watch]** Vérifier les jobs scheduler en file d'attente avant déploiement (Admin Convex → Scheduler)

---

## 8. Tableau récapitulatif des actions correctives

| # | Type | Fichier(s) | Problème | Action |
|---|---|---|---|---|
| 2.1 | Manquant | `sms_provider.ts:713-744` | RENT_DURATIONS_HOURS non migré | Déplacer dans `activations.ts` ou `config.ts` |
| 2.2 | Manquant | `users.ts:62-114` | `syncUser` crée `balanceUsd: 0`, cassé après Step 20 | Ajouter création wallet dans `syncUser` ou garder champ en optional |
| 2.3 | Manquant | `purchases.ts:242-283` | 3 utilitaires utilisés par `sms_provider.ts` non migrés | Déplacer dans `users.ts` AVANT Step 19 |
| 3.1 | Changement | `sms_provider.ts:454,1225` | Double appel `refundEscrow` | Supprimer appel dans `cancelActivation`, garder seulement dans `cancelActivationAction` |
| 3.2 | Changement | `sms_provider.ts:1155-1181` | Perte comptabilité fournisseur | Ajouter suivi `providerCostCents` dans releaseEscrow |
| 3.3 | Changement | `wallet-page-shell.tsx:21` | Conversion XAF * 600 obsolete | Réécrire mapping pour `amountCents` |
| 3.4 | Changement | `recharge-panel.tsx`, `mobile-bottom-nav.tsx` | 2 consommateurs oubliés | Ajouter au plan Steps 9-10 |
| 4.1 | Risque | `purchases.ts:233-240` | Hot document promoCodes | Mitiger avec table de logs ou limite Convex |
| 4.3 | Risque | `sms_provider.ts:659` | Référence cassée après Step 19 | Déplacer `internalGetUserByBetterAuthId` |
| 4.4 | Risque | `purchases.ts:468-507` | `backfillComptes` supprimé trop tôt | Réutiliser dans Step 16 |
| 5.1 | Dépendance | `convex/` | Graphe d'appels complexes | Ordre suppression : `purchases.ts` → `comptabilite.ts` en dernier |
| 6.2 | Contrat | `wallet-page-shell.tsx:17-27` | Mapping TransactionItem à réécrire | Expliciter dans Step 11 |
