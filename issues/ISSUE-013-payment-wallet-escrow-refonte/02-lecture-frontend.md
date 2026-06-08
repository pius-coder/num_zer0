# Phase 2 — Lecture ciblée Frontend

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** subagent reader

---

## 1. Composants / Hook Signatures

### `src/components/purchases/hooks/use-purchases.ts` (68 lines)

```ts
// Query keys factory
purchaseKeys = { all, purchases, balance, mouvements }

// Queries
useBalance(): UseQueryResult<{ balanceUsd: number }>
useMouvements(): UseQueryResult<any[]>  // ← api.comptabilite.getMyMouvements
usePurchases(): UseQueryResult<any[]>   // ← api.purchases.getPurchases
useValidatePromoCode(code: string): UseQueryResult (enabled: code.length >= 3)

// Mutations
useInitiateDirectPay(): UseMutationResult (actionFn: api.purchases.initiateDirectPay)
useVerifyPurchase(): UseMutationResult (actionFn: api.purchases.verifyPurchase)
useCancelPurchase(): UseMutationResult (mutationFn: api.purchases.cancelPurchase)
```

### `src/components/purchases/hooks/use-activations.ts` (141 lines)

```ts
// Query keys factory
activationKeys = { all, activation(id), myActivations, numberQuantity(country),
                   topCountries(service), operators(country), prices(country, service?) }

// Queries
useActivation(activationId: Id<'activations'> | null): UseQueryResult<SmsActivation>
useMyActivations(): UseQueryResult
useNumberQuantity(country: string): UseQueryResult (staleTime: 30s)
useTopCountries(service: string): UseQueryResult (staleTime: 60s)
useOperators(country: string): UseQueryResult (staleTime: 30s)
usePrices(country: string, service?: string): UseQueryResult (staleTime: 30s)
useRentPriceList(country: string, service: string): UseQueryResult (staleTime: 30s)
useFreePrices(country: string, service: string): UseQueryResult (staleTime: 30s)

// Mutations (all useConvexMutation)
useInitiateActivation(): UseMutationResult  // api.sms_provider.initiateActivation
useCompleteActivation(): UseMutationResult  // api.sms_provider.completeActivation
useCancelActivation(): UseMutationResult    // api.sms_provider.cancelActivation
useRequestAnotherSms(): UseMutationResult   // api.sms_provider.requestAnotherSms
useInitiateRentalActivation(): UseMutationResult // api.sms_provider.initiateRentalActivation
```

### `src/components/admin/hooks/use-admin-queries.ts` (144 lines)

```ts
adminKeys = { all, analytics, users, purchases, activations, accounting, promo_codes, margins, packages }

// Queries
useAdminAnalytics(): UseQueryResult  // api.analytics.getAnalyticsSummary
useAdminUsers(): UseQueryResult      // api.users.getAllUsers
useAdminPurchases(): UseQueryResult  // api.purchases.getAllPurchases
useAdminActivations(): UseQueryResult // api.sms_provider.getAllActivations
useAdminComptes(): UseQueryResult    // api.comptabilite.getAllComptes   ← LEGACY
useAdminPieces(): UseQueryResult     // api.comptabilite.getAllPieces    ← LEGACY
useAdminPromoCodes(): UseQueryResult // api.promo_codes.list
useAdminMargins(): UseQueryResult    // api.margins.list
useAdminPackages(): UseQueryResult   // api.packages.list

// Mutations (all useConvexMutation)
useDeleteUser(): UseMutationResult         // api.users.deleteUser
useCreatePromoCode(): UseMutationResult    // api.promo_codes.create
useUpdatePromoCode(): UseMutationResult    // api.promo_codes.update
useDeletePromoCode(): UseMutationResult    // api.promo_codes.delete_
useCreateMargin(): UseMutationResult       // api.margins.create
useUpdateMargin(): UseMutationResult       // api.margins.update
useDeleteMargin(): UseMutationResult       // api.margins.delete_
useCreatePackage(): UseMutationResult      // api.packages.create
useUpdatePackage(): UseMutationResult      // api.packages.update
useDeletePackage(): UseMutationResult      // api.packages.delete_
```

---

## 2. Data Contracts Attendus (Frontend)

### `TransactionItem` (`wallet-transaction-list.tsx:5-15`)
```ts
interface TransactionItem {
  id: string
  label: string
  date: string
  amountXaf: number      // calculé: Math.round(montant * 600)
  credit: number         // m.montant si sens === 'debit'
  debit: number          // m.montant si sens === 'credit'
  soldeApres: number
  kind: 'purchase' | 'number_purchase'
  statut: string         // 'validee' | 'annulee' | autre
}
```

### `SmsActivation` (`src/type/sms_activation.ts:16-35`)
```ts
interface SmsActivation {
  _id: string; _creationTime: number; userId: string
  service: string; country: string; providerId?: number
  phoneNumber?: string; status: SmsActivationStatus
  maxPrice: number; operator?: string; smsCode?: string
  canGetAnotherSms: boolean; rentEndTime?: number
  providerCost?: number; priceCharged: number
  errorMessage?: string; createdAt: number; updatedAt: number
}
```
Status: `awaiting_number | awaiting_sms | sms_received | completed | cancelled | expired | no_numbers | max_price_too_low`

### `SmsActivationStatus` (`sms_activation.ts:37-45`)
8 états — utilisés dans `activation-detail.tsx` pour gérer les actions possibles.

### Balance (`useBalance`)
```ts
{ balanceUsd: number }
```

### Mouvements (`useMouvements`)
Aucun type strict — mappé avec `(m: any)` dans `wallet-page-shell.tsx:17`.
Champs observés: `id, libelle, date, montant, sens (débit/credit), soldeApres, statut`

### Purchases (`usePurchases`, `useAdminPurchases`)
Aucun type strict — mappé avec `(p: any)`.
Champs observés: `_id, userId, priceXaf, paymentMethod, status, promoCode, _creationTime, createdAt`

### Comptes / Pièces (admin)
Aucun type strict — mappé avec `(c: any)`, `(p: any)`.
Champs observés comptes: `_id, code, libelle, solde`
Champs observés pièces: `_id, date, libelle, statut, reference`

### `InitiateActivationInput` (`sms_activation.ts:47-52`)
```ts
{ service: string, country: string, maxPrice?: number, operator?: string }
```

### Données de prix
```ts
// GetPricesResult
Record<string, Record<string, { cost: number; count: number }>>
// → { [countryCode]: { [service]: { cost, count } } }

// GetNumberQuantityResult
{ [serviceCode: string]: number }
```

### Données opérateurs
```ts
GetOperatorsResult = string[]
```

---

## 3. Query Keys

| Keys | Factory | Utilisé par |
|------|---------|-------------|
| `['purchases']` | `purchaseKeys.all` | invalidations globales |
| `['purchases', 'purchases']` | `purchaseKeys.purchases()` | `usePurchases` |
| `['balance']` | `purchaseKeys.balance()` | `useBalance` |
| `['mouvements']` | `purchaseKeys.mouvements()` | `useMouvements` |
| `['activations']` | `activationKeys.all` | invalidations globales |
| `['activations', 'activation', id]` | `activationKeys.activation(id)` | `useActivation` |
| `['activations', 'my']` | `activationKeys.myActivations()` | `useMyActivations` |
| `['activations', 'quantity', country]` | `activationKeys.numberQuantity(country)` | `useNumberQuantity` |
| `['activations', 'top', service]` | `activationKeys.topCountries(service)` | `useTopCountries` |
| `['activations', 'operators', country]` | `activationKeys.operators(country)` | `useOperators` |
| `['activations', 'prices', country, service?]` | `activationKeys.prices(country, service?)` | `usePrices` |
| `['activations', 'rent', country, service]` | inline | `useRentPriceList` |
| `['activations', 'freePrices', country, service]` | inline | `useFreePrices` |
| `['admin']` | `adminKeys.all` | invalidations globales |
| `['admin', 'analytics']` | `adminKeys.analytics()` | `useAdminAnalytics` |
| `['admin', 'users']` | `adminKeys.users()` | `useAdminUsers` |
| `['admin', 'purchases']` | `adminKeys.purchases()` | `useAdminPurchases` |
| `['admin', 'activations']` | `adminKeys.activations()` | `useAdminActivations` |
| `['admin', 'accounting']` | `adminKeys.accounting()` | `useAdminComptes`, `useAdminPieces` |
| `['admin', 'promo_codes']` | `adminKeys.promo_codes()` | CRUD promo codes |
| `['admin', 'margins']` | `adminKeys.margins()` | CRUD margins |
| `['admin', 'packages']` | `adminKeys.packages()` | CRUD packages |

---

## 4. Mutations

| Hook | Convex Function | Type | Invalide |
|------|----------------|------|----------|
| `useInitiateDirectPay` | `api.purchases.initiateDirectPay` | `useConvexAction` | `purchaseKeys.all`, `.balance()`, `.mouvements()` |
| `useVerifyPurchase` | `api.purchases.verifyPurchase` | `useConvexAction` | `purchaseKeys.all`, `.balance()`, `.mouvements()` |
| `useCancelPurchase` | `api.purchases.cancelPurchase` | `useConvexMutation` | `purchaseKeys.all`, `.balance()`, `.mouvements()` |
| `useInitiateActivation` | `api.sms_provider.initiateActivation` | `useConvexMutation` | `activationKeys.myActivations()` |
| `useCompleteActivation` | `api.sms_provider.completeActivation` | `useConvexMutation` | `activationKeys.all` |
| `useCancelActivation` | `api.sms_provider.cancelActivation` | `useConvexMutation` | `activationKeys.all` |
| `useRequestAnotherSms` | `api.sms_provider.requestAnotherSms` | `useConvexMutation` | `activationKeys.all` |
| `useInitiateRentalActivation` | `api.sms_provider.initiateRentalActivation` | `useConvexMutation` | `activationKeys.myActivations()` |
| `useDeleteUser` | `api.users.deleteUser` | `useConvexMutation` | `adminKeys.users()` |
| `useCreatePromoCode` | `api.promo_codes.create` | `useConvexMutation` | `adminKeys.promo_codes()` |
| `useUpdatePromoCode` | `api.promo_codes.update` | `useConvexMutation` | `adminKeys.promo_codes()` |
| `useDeletePromoCode` | `api.promo_codes.delete_` | `useConvexMutation` | `adminKeys.promo_codes()` |
| `useCreateMargin` | `api.margins.create` | `useConvexMutation` | `adminKeys.margins()` |
| `useUpdateMargin` | `api.margins.update` | `useConvexMutation` | `adminKeys.margins()` |
| `useDeleteMargin` | `api.margins.delete_` | `useConvexMutation` | `adminKeys.margins()` |
| `useCreatePackage` | `api.packages.create` | `useConvexMutation` | `adminKeys.packages()` |
| `useUpdatePackage` | `api.packages.update` | `useConvexMutation` | `adminKeys.packages()` |
| `useDeletePackage` | `api.packages.delete_` | `useConvexMutation` | `adminKeys.packages()` |

**Toutes les mutations utilisent `onSettled`** (pas `onSuccess`) pour leurs invalidations — donc même les échecs invalident le cache.

---

## 5. Invalidations — Graphe de dépendances

```
useInitiateDirectPay  → purchaseKeys.all + .balance() + .mouvements()
useVerifyPurchase     → purchaseKeys.all + .balance() + .mouvements()
useCancelPurchase     → purchaseKeys.all + .balance() + .mouvements()

useInitiateActivation        → activationKeys.myActivations()
useInitiateRentalActivation  → activationKeys.myActivations()
useCompleteActivation        → activationKeys.all
useCancelActivation          → activationKeys.all
useRequestAnotherSms         → activationKeys.all
```

**Observation:** Les mutations "purchase" invalident **toujours** les 3 keys ensemble — pas d'invalidation fine.

---

## 6. Dépendances Legacy Convex (Frontend → Backend)

| Hook Frontend | Convex Backend | Legacy? | Remplaçant |
|---|---|---|---|
| `useBalance` | `api.users.getUserBalance` | OUI — balance lue depuis `users.balanceUsd` doublon avec `comptes(411-user).solde` | `api.wallets.getBalance` |
| `useMouvements` | `api.comptabilite.getMyMouvements` | OUI — comptabilité artisanale = wallet | `api.wallet_ledger.list` |
| `usePurchases` | `api.purchases.getPurchases` | OUI — flux Fapshi legacy | `api.orders.list` |
| `useInitiateDirectPay` | `api.purchases.initiateDirectPay` | OUI — Fapshi direct | `api.payment_intents.create` |
| `useVerifyPurchase` | `api.purchases.verifyPurchase` | OUI — callback utilisateur | `api.payment_intents.verify` |
| `useCancelPurchase` | `api.purchases.cancelPurchase` | OUI | `api.payment_intents.cancel` |
| `useAdminPurchases` | `api.purchases.getAllPurchases` | OUI | `api.orders.listAll` |
| `useAdminComptes` | `api.comptabilite.getAllComptes` | OUI — wallet legacy | `api.wallets.listAll` |
| `useAdminPieces` | `api.comptabilite.getAllPieces` | OUI — ledger legacy | `api.wallet_ledger.listAll` |
| `useAdminAnalytics` | `api.analytics.getAnalyticsSummary` | NON? | À vérifier |
| `useActivation/useComplete/useCancel` | `api.sms_provider.*` | NON — à garder | N/A |
| `useAdminActivations` | `api.sms_provider.getAllActivations` | NON | N/A |
| `useAdminPromoCodes` | `api.promo_codes.*` | NON (ou à migrer) | N/A |
| `useAdminMargins` | `api.margins.*` | NON (ou à migrer) | N/A |
| `useAdminPackages` | `api.packages.*` | OUI — packages legacy | À supprimer |

---

## 7. Max-Lines — Vérifications

| Fichier | Lignes | Limite 200 | Statut |
|---|---|---|---|
| `purchase-panel.tsx` | **357** | ❌ Dépasse | DOIT être refactoré |
| `step-topup.tsx` | **234** | ❌ Dépasse | DOIT être refactoré |
| `use-admin-queries.ts` | 144 | ✅ OK | Mais très dense |
| `use-activations.ts` | 141 | ✅ OK | |
| `activation-detail.tsx` | 132 | ✅ OK | |
| `admin-accounting.tsx` | 121 | ✅ OK | |
| `wallet-transaction-list.tsx` | 110 | ✅ OK | |
| `wallet-page-shell.tsx` | 55 | ✅ OK | |
| `payment/result.tsx` | 171 | ✅ OK | |
| `recharge-drawer.tsx` | 56 | ✅ OK | |
| `step-method.tsx` | 57 | ✅ OK | |
| `payment-methods.ts` | 32 | ✅ OK | |
| `admin-purchases.tsx` | 76 | ✅ OK | |
| `wallet-purchase-history.tsx` | 68 | ✅ OK | |
| `use-purchases.ts` | 68 | ✅ OK | |

**Deux fichiers en infraction** → `purchase-panel.tsx` (357) et `step-topup.tsx` (234). Tous deux seront remplacés/supprimés par la refonte.

---

## 8. Éléments UI Réutilisables / Supprimables

### Réutilisables (à garder dans la refonte)

| Composant | Fichier | Raison |
|---|---|---|
| `WalletBalanceCard` | `wallet-balance-card.tsx` | Encapsulation du solde, réutilisable |
| `WalletBalanceTotal` | `wallet-balance-total.tsx` | Affichage solde simple |
| `WalletTransactionList` + `WalletTransactionItem` | `wallet-transaction-list.tsx` | Liste générique, réutilisable avec nouveau `TransactionItem` |
| `WalletTransactionTabs` | `wallet-transaction-tabs.tsx` | Tabs filtre (all/purchase/numbers) |
| `WalletTransactionEmpty` | `wallet-transaction-empty.tsx` | État vide générique |
| `WalletCtaFooter` | `wallet-cta-footer.tsx` | CTA recharge/navigation |
| `PaymentFeedbackMessage` | `payment-feedback-message.tsx` | Feedback message générique |
| `PaymentConfirmDialog` | `payment-confirm-dialog.tsx` | Dialog confirmation utilisateur |
| `TimelineLine` | `my-space/timeline-line.tsx` | Timeline d'activation |
| `ModeToggle` | `purchase-panel.tsx` (inline) | Toggle one-time/subscription |
| `PriceStepper` | `my-space/price-stepper.tsx` | Stepper prix activation |
| `OperatorSelector` | `my-space/operator-selector.tsx` | Sélecteur opérateur |
| `RentalOptions` | `my-space/rental-options.tsx` | Options location |
| `ServiceIcon` / `ServiceBadge` | `my-space/` | Icônes/badges service |
| `StepMethod` | `recharge/step-method.tsx` | Sélecteur méthode paiement |
| `Sheet` shadcn | `common/ui/sheet` | Drawer pattern — réutilisable partout |

### Supprimables / Remplaçables par la refonte

| Élément | Fichier | Raison |
|---|---|---|
| `PendingPaymentBanner` | `wallet/pending-payment-banner.tsx` | Retourne `null` — mort |
| `WalletPaymentMethods` | `wallet/wallet-payment-methods.tsx` | Données mock hardcodées, inutilisé dans shell |
| `WalletBalanceBreakdown` | `wallet/wallet-balance-breakdown.tsx` | Ne fait rien d'utile (juste bouton Recharger) |
| `WalletPurchaseHistory` | `wallet/wallet-purchase-history.tsx` | Branchement legacy `purchases` → sera remplacé par `orders` |
| `PaymentConfirmDialog` | `wallet/payment-confirm-dialog.tsx` | UI legacy Fapshi — inutilisé dans le shell actuel |
| `TransactionRow` | `wallet/transaction-row.tsx` | Redondant avec `WalletTransactionItem` |
| `METHODS` hardcodé | `recharge/payment-methods.ts` | Remplacé par config dynamique depuis backend |
| `XAF_RATE = 600` | `step-topup.tsx:26` + `my-space/constants.ts:59` | Taux hardcodé dupliqué |
| `FLAG_BASE` | `my-space/constants.ts:60` | URL CDN externe — à garder mais centraliser |
| `getDefaultMarginXaf` | `my-space/utils.ts:7-11` | Marge en XAF → à calculer en USD |
| Tout le module `comptabilite` | via `useAdminComptes`, `useAdminPieces` | Remplacement par `wallets` + `wallet_ledger` |
| Tout le module `purchases` | via `usePurchases`, `useInitiateDirectPay` | Remplacement par `payment_intents` + `orders` |
| SPA legacy files | 5 fichiers listés dans `my-space/docs/TODOS.md` | Déjà en cleanup, indépendant de cette issue |

### Patterns UX identifiés (à reproduire)

1. **Sheet bottom drawer** pour formulaires (recharge, purchase panel) — pattern établi
2. **Optimistic update pas encore utilisé** côté frontend (les hooks sont simples, pas de `withOptimisticUpdate`)
3. **`onSettled`** pour toutes les invalidations — pattern cohérent
4. **`#/` alias** pour imports (configuré dans tsconfig/vite/package.json)
5. **Barrel exports** dans `index.ts` — systématique
6. **Constantes et utilitaires** extraits dans `constants.ts` / `utils.ts`

---

## 9. Résumé des Risques Frontend

1. **`any` types omniprésents** — `mouvements`, `purchases`, `comptes`, `pieces` tous typés en `any`
2. **Deux sources de balance** — `users.balanceUsd` et `comptes(411-user).solde` — risque d'incohérence affichée
3. **Taux XAF/USD dupliqué** — 600 dans `step-topup.tsx` et `my-space/constants.ts`
4. **Montants en XAF frontend** mais wallet en USD — conversions back-and-forth fragiles
5. **Aucun typage partagé** entre Convex et React Query — les types sont redéclarés manuellement dans `sms_activation.ts`
6. **`PendingPaymentBanner` est un stub** — retourne `null`, mais pas de ticket de follow-up associé
7. **`recharge-drawer.tsx` appelle `authClient.signIn.anonymous()`** si pas de session — logique d'auth couplée au paiement
