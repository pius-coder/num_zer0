# Phase 5 — Plan Complet (Steps Atomiques)

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** planning-agent (révisé par convex-review-agent)

---

## Structure du plan

24 steps, ordonnés par dépendances. Chaque step = un commit potentiel.

**Organisation:**
- Steps 1-3: Schéma + nouvelles tables + config
- Steps 4-8: Backend Convex (wallet, payment_intents, escrows, orders, http)
- Step 9: Tests backend
- Steps 10-13: Frontend hooks + composants (wallet, recharge, admin)
- Steps 14-18: Migration données via @convex-dev/migrations + vérifications
- Steps 19-20: Bascule sms_provider + correction bug double refund
- Steps 21-23: Suppression legacy (modules → schéma → hooks)
- Step 24: Vérifications finales

---

## Conventions Convex strictes (DOC)

Rappel des règles Convex vérifiées par cette revue :

| Règle | Mutation | Action | Query |
|-------|----------|--------|-------|
| `fetch()` disponible ? | NON | OUI (10 min timeout) | NON |
| `ctx.db` disponible ? | OUI | NON (via `ctx.runMutation()`/`ctx.runQuery()`) | OUI |
| Écriture DB directe ? | OUI (atomique) | NON (via `ctx.runMutation()`) | NON |
| Timeout | 1s | 10 min | 1s |
| Reactive ? | Non (déclenche queries) | Non | Oui |
| Appels HTTP ? | NON | OUI | NON |

Sources:
- https://docs.convex.dev/functions/mutation-functions (mutations: pas de `fetch`, déterministes)
- https://docs.convex.dev/functions/actions (actions: `fetch` OK, pas de `ctx.db`, timeout 10 min)
- https://docs.convex.dev/scheduling/scheduled-functions (scheduler: mutations ET actions, internals recommandées)
- https://docs.convex.dev/production/state/limits (mutation 1s, action 10 min)
- https://docs.convex.dev/api/interfaces/server.GenericActionCtx (`ctx.db` is not available in actions)
- https://docs.convex.dev/functions/http-actions (HTTP endpoints = actions)

---

## Step 1 — Ajouter les 6 nouvelles tables au schéma Convex

- **Fichiers:** `convex/schema.ts`
- **Résultat attendu:** Le schéma contient les tables `wallets`, `wallet_ledger_entries`, `payment_intents`, `escrows`, `orders`, `provider_operations` avec leurs validateurs et indexes. Toutes les tables legacy restent inchangées. `users.balanceUsd` et `users.hasMadeDeposit` marqués `v.optional()` (deprecated). `npx convex deploy` passe.
- **Dépend de:** rien
- **Risque:** Aucun (ajout seulement). Le déploiement Convex avec `defineSchema` ajoute les tables sans affecter les existantes.

**Détail des tables:**

```ts
wallets: defineTable({
  userId: v.string(),
  balanceCents: v.number(),     // cents entiers, pas de flottants
  currency: v.string(),          // 'USD'
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_userId', ['userId'])

wallet_ledger_entries: defineTable({
  walletId: v.id('wallets'),
  type: v.union(
    v.literal('credit'),         // recharge
    v.literal('debit'),          // escrow hold
    v.literal('release'),        // escrow release (revenue)
    v.literal('refund'),         // escrow refund
  ),
  amountCents: v.number(),
  balanceAfterCents: v.number(),
  referenceType: v.union(
    v.literal('payment_intent'),
    v.literal('escrow'),
    v.literal('order'),
    v.literal('admin'),
  ),
  referenceId: v.string(),
  description: v.string(),
  metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
  createdAt: v.number(),
})
  .index('by_walletId', ['walletId'])
  .index('by_walletId_createdAt', ['walletId', 'createdAt'])
  .index('by_reference', ['referenceType', 'referenceId'])

payment_intents: defineTable({
  userId: v.string(),
  amountCents: v.number(),
  currency: v.string(),          // 'USD'
  status: v.union(
    v.literal('pending'),
    v.literal('processing'),
    v.literal('succeeded'),
    v.literal('failed'),
    v.literal('cancelled'),
    v.literal('expired'),
  ),
  gateway: v.string(),           // 'fapshi'
  gatewayTransactionId: v.optional(v.string()),
  idempotencyKey: v.string(),
  xafAmount: v.number(),
  xafRate: v.number(),
  failureReason: v.optional(v.string()),
  metadata: v.optional(v.object({
    phone: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    promoCode: v.optional(v.string()),
    promoDiscount: v.optional(v.number()),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_userId', ['userId'])
  .index('by_idempotencyKey', ['idempotencyKey'])
  .index('by_gatewayTransactionId', ['gatewayTransactionId'])
  .index('by_status', ['status'])

escrows: defineTable({
  userId: v.string(),
  activationId: v.id('activations'),
  amountCents: v.number(),
  status: v.union(
    v.literal('pending'),        // created but provider not yet called
    v.literal('held'),           // provider called, funds blocked
    v.literal('released'),       // activation completed, funds captured
    v.literal('refunded'),       // activation cancelled, funds returned
    v.literal('partial_released'), // partial capture
  ),
  providerCostCents: v.optional(v.number()),
  marginCents: v.optional(v.number()),
  description: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_userId', ['userId'])
  .index('by_activationId', ['activationId'])
  .index('by_status', ['status'])

orders: defineTable({
  userId: v.string(),
  type: v.union(
    v.literal('recharge'),
    v.literal('activation'),
    v.literal('rental'),
  ),
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('cancelled'),
    v.literal('refunded'),
  ),
  amountCents: v.number(),
  paymentIntentId: v.optional(v.id('payment_intents')),
  escrowId: v.optional(v.id('escrows')),
  description: v.string(),
  metadata: v.optional(v.object({})),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_userId', ['userId'])
  .index('by_type', ['type'])

provider_operations: defineTable({
  provider: v.string(),          // 'fapshi' | 'sms_online_pro'
  operation: v.string(),         // 'initiate-pay' | 'get-number' | ...
  request: v.string(),           // JSON stringified request
  response: v.string(),          // JSON stringified response
  status: v.union(
    v.literal('success'),
    v.literal('error'),
  ),
  referenceId: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_referenceId', ['referenceId'])
  .index('by_provider_operation', ['provider', 'operation'])
```

---

## Step 2 — Créer le module config.ts (taux de change centralisé)

- **Fichiers:** `convex/config.ts`
- **Résultat attendu:** Un module avec une query `getXafRate` qui lit depuis une nouvelle table `exchangeRates` ou retourne une valeur par défaut (600). Supprime tous les `XAF_RATE = 600` dupliqués dans `purchases.ts`, `users.ts`, `step-topup.tsx`, `my-space/constants.ts`. Ajouter la table `exchangeRates` dans le schéma (2 champs : `rate`, `updatedAt`).
- **Dépend de:** Step 1 (schema modifié)
- **Risque:** Si le taux par défaut est incorrect, toutes les conversions sont fausses. Valeur par défaut = 600 vérifiée.

**Fichiers modifiés:**
- `convex/config.ts` (NOUVEAU)
- `convex/schema.ts` (ajout table `exchangeRates`)
- `convex/purchases.ts` (remplacer `600` par `internal.config.getXafRate`)
- `convex/sms_provider.ts` (remplacer `XAF_USD_RATE`)
- `convex/users.ts` (remplacer `600` si présent)
- `src/components/recharge/step-topup.tsx` (remplacer `XAF_RATE = 600` par appel API)
- `src/components/my-space/constants.ts` (supprimer `XAF_USD_RATE`)
- `src/components/my-space/country-list.tsx` (remplacer import `XAF_USD_RATE` par `getXafRate`)
- `src/components/my-space/index.ts` (remplacer export `XAF_USD_RATE` par export du taux depuis config)

---

## Step 3 — Créer le module provider_operations.ts

- **Fichiers:** `convex/provider_operations.ts`
- **Résultat attendu:** Une mutation internal `logOperation` qui enregistre chaque appel provider (provider, operation, request, response, status, referenceId). Une query `getByReference` pour retrouver les opérations liées à une référence.
- **Dépend de:** Step 1 (table `provider_operations` existe)
- **Risque:** Aucun (nouveau module, non utilisé encore).

---

## Step 4 — Créer le module wallet.ts (backend wallet + ledger)

- **Fichiers:** `convex/wallet.ts`
- **Résultat attendu:** Module complet avec :
  - `getBalance`: query publique, lit `wallets.balanceCents` pour l'utilisateur courant
  - `getLedger`: query publique, lit `wallet_ledger_entries` paginé par `by_walletId_createdAt`
  - `internalGetOrCreateWallet`: internalMutation, crée wallet si pas existant
  - `internalCreditWallet`: internalMutation, crédite le wallet + crée entry ledger atomiquement, balanceAfterCents calculé
  - `internalDebitWallet`: internalMutation, débite le wallet + crée entry ledger atomiquement, balanceAfterCents calculé, vérifie solde suffisant
  - `getAllWallets`: query admin, tous les wallets
  - `getWalletByUserId`: query, lit un wallet par userId
- **Dépend de:** Step 1 (tables `wallets`, `wallet_ledger_entries`)
- **Risque:** Une erreur dans `internalDebitWallet` peut créer une incohérence ledger. Tester : crédit + débit = balance finale correcte.

**Détail `internalCreditWallet`:**
```ts
// Transaction atomique :
// 1. Lire wallet (avec verrouillage OCC)
// 2. Calculer nouveau balanceCents = wallet.balanceCents + amountCents
// 3. PATCH wallet.balanceCents
// 4. INSERT wallet_ledger_entry avec balanceAfterCents = nouveau balanceCents
// Tout dans la même mutation → atomique
```

**Détail `internalDebitWallet`:**
```ts
// Transaction atomique :
// 1. Lire wallet (avec verrouillage OCC)
// 2. Vérifier wallet.balanceCents >= amountCents
// 3. Calculer nouveau balanceCents = wallet.balanceCents - amountCents
// 4. PATCH wallet.balanceCents
// 5. INSERT wallet_ledger_entry avec balanceAfterCents = nouveau balanceCents
// Tout dans la même mutation → atomique
```

---

## Step 5 — Créer le module payment_intents.ts (flux Fapshi)

- **Fichiers:** `convex/payment_intents.ts`
- **Résultat attendu:** Module complet avec respect strict des types Convex :

### Contexte Convex (Action vs Mutation)

**IMPORTANT — Règle Convex:** Les actions (`initiatePayment`, `verifyPaymentIntent`) n'ont PAS accès à `ctx.db`. Elles ne peuvent PAS écrire directement dans la DB. Toute opération DB passe par `ctx.runMutation()`. Cf. https://docs.convex.dev/functions/actions + https://docs.convex.dev/api/interfaces/server.GenericActionCtx.

```ts
// CE QU'ON NE PEUT PAS FAIRE (action → erreur Convex) :
export const initiatePayment = action({
  handler: async (ctx, args) => {
    await ctx.db.insert('payment_intents', { ... }); // ERROR: ctx.db n'existe pas dans les actions
    await ctx.db.patch(id, { status: 'processing' }); // ERROR: ctx.db n'existe pas dans les actions
  }
});

// CE QU'IL FAUT FAIRE (action → ctx.runMutation) :
export const initiatePayment = action({
  handler: async (ctx, args) => {
    const piId = await ctx.runMutation(internal.payment_intents.internalCreatePaymentIntent, { ... });
    const response = await fetch('https://api.fapshi.com/initiate-pay', { ... });
    await ctx.runMutation(internal.payment_intents.internalMarkPaymentProcessing, {
      paymentIntentId: piId, gatewayTransactionId: response.transId
    });
  }
});
```

### Fonctions du module

- **`initiatePayment`: action authentifiée** (⚠️ CORRIGÉE : précision sur `ctx.runMutation()`)
  1. Valide le montant (>= 1500 XAF)
  2. Appelle `ctx.runMutation(internal.payment_intents.internalCreatePaymentIntent, args)` pour créer le doc dans la DB
  3. Appelle Fapshi `/initiate-pay` via `fetch()` (ce qui nécessite une action, pas une mutation)
  4. Appelle `ctx.runMutation(internal.provider_operations.logOperation, ...)` pour enregistrer dans provider_operations
  5. Appelle `ctx.runMutation(internal.payment_intents.internalMarkPaymentProcessing, { paymentIntentId, gatewayTransactionId, checkoutUrl })` pour mettre à jour le payment_intent dans la DB
  6. Retourne `{ checkoutUrl, paymentIntentId }`
  - **Pourquoi action ?** Car elle fait `fetch()` vers Fapshi. Les mutations Convex ne peuvent PAS faire de `fetch()`.

- **`verifyPaymentIntent`: action** (⚠️ CORRIGÉE : précision sur `ctx.runMutation()`)
  1. Appelle Fapshi `/payment-status` via `fetch()` (ce qui nécessite une action)
  2. Si status Fapshi = 'success' → `ctx.runMutation(internal.payment_intents.confirmPaymentIntent, { paymentIntentId })`
  3. Sinon → `ctx.runMutation(internal.payment_intents.internalMarkPaymentFailed, { paymentIntentId, failureReason })`
  - **Pourquoi action ?** Car elle fait `fetch()` vers Fapshi.

- **`internalMarkPaymentProcessing`: internalMutation** (NOUVELLE — nécessaire pour l'action `initiatePayment`)
  - Patch le payment_intent : `status → 'processing'`, `gatewayTransactionId`, `updatedAt`
  - Appelée uniquement par `initiatePayment` via `ctx.runMutation()`
  - Atomicité garantie (mutation Convex).

- **`internalMarkPaymentFailed`: internalMutation** (NOUVELLE — nécessaire pour l'action `verifyPaymentIntent`)
  - Patch le payment_intent : `status → 'failed'`, `failureReason`, `updatedAt`
  - Appelée uniquement par `verifyPaymentIntent` via `ctx.runMutation()`

- **`internalCreatePaymentIntent`: internalMutation** atomique
  - Insère le doc payment_intent, retourne l'ID
  - Appelée par `initiatePayment` via `ctx.runMutation()`

- **`confirmPaymentIntent`: internalMutation** ATOMIQUE idempotente
  1. Lit payment_intent
  2. Si status déjà 'succeeded' → return early (idempotent)
  3. Appelle `internalCreditWallet` via `ctx.runMutation(internal.wallet.internalCreditWallet, ...)` (même transaction car internalMutation → internalMutation)
  4. Patch status → 'succeeded', updatedAt
  5. Crée une `order` de type 'recharge'
  - **Pourquoi internalMutation ?** Écriture DB, pas de HTTP. Appelée par les actions et le scheduler.

- **`cancelPaymentIntent`: mutation** (publique — appelée depuis le frontend)
  - Passe status → 'cancelled'

- **`expireOrphanedPaymentIntents`: internalMutation** (pour scheduler uniquement)
  - (CORRIGÉE : était `mutation`, passe à `internalMutation` car elle est uniquement appelée par le scheduler, pas depuis le frontend)
  - Expire les pending > 30min

- **`listPaymentIntents`: query** utilisateur
- **`listAllPaymentIntents`: query** admin

- **Dépend de:** Step 1 (table `payment_intents`), Step 3 (`provider_operations.ts`), Step 4 (`wallet.ts`)
- **Risque:** L'action `initiatePayment` doit gérer l'échec Fapshi sans laisser un payment_intent orphelin. Utiliser `try/catch` : si Fapshi échoue → appeler `ctx.runMutation(internal.payment_intents.internalMarkPaymentFailed, ...)`.
- **⚠️ Changements majeurs par rapport à la version précédente :**
  - Ajout de `internalMarkPaymentProcessing` (internalMutation) — l'action `initiatePayment` ne peut pas patcher la DB directement
  - Ajout de `internalMarkPaymentFailed` (internalMutation) — idem
  - `expireOrphanedPaymentIntents` passe de `mutation` à `internalMutation` (scheduler-only)
  - Toutes les actions précisent qu'elles utilisent `ctx.runMutation()` pour écrire dans la DB
  - Justification : documentation Convex — `ctx.db` n'existe pas dans les actions (https://docs.convex.dev/api/interfaces/server.GenericActionCtx)

**Clarification — Migration des utilitaires depuis purchases.ts:**
Les fonctions `internalGetUserByBetterAuthId`, `internalCreateUser`, `internalUpdateUserDeposit` actuellement dans `convex/purchases.ts` (appelées par `sms_provider.ts:659`) doivent être déplacées dans `convex/users.ts` AVANT la suppression de `purchases.ts` (Step 20). Ajouter ce déplacement dans ce step ou dans un step dédié `convex/users.ts`.

**Clarification — Hot document promoCodes:**
Remplacer `internalIncrementPromo` (qui écrit directement sur `promoCodes.usedCount`) par une table `promo_usage` avec entries individuelles, agrégées via index. Cela évite le hot document si un code promo devient populaire. Ajouter la table `promo_usage` dans `convex/schema.ts` et les mutations associées dans un nouveau module `convex/promo_usage.ts`.

---

## Step 6 — Créer le module escrows.ts (machine à états)

- **Fichiers:** `convex/escrows.ts`
- **Résultat attendu:** Module avec machine à états complète :
  - `internalHoldEscrow`: internalMutation
    1. Vérifie solde suffisant via `internalDebitWallet` (débit wallet type 'debit')
    2. Crée escrow status='held'
    - Si `internalDebitWallet` échoue → throw (escrow non créé)
  - `internalReleaseEscrow`: internalMutation (idempotent)
    1. Vérifie escrow.status === 'held'
    2. Calcule marge (prix facturé - coût provider)
    3. Appelle `internalDebitWallet` de amountCents (l'argent est vraiment dépensé maintenant)
    4. Patch escrow status → 'released', providerCostCents, marginCents
    5. Crée entry ledger type 'release'
  - `internalRefundEscrow`: internalMutation (idempotent)
    1. Vérifie escrow.status === 'held'
    2. Appelle `internalCreditWallet` de amountCents (remboursement)
    3. Patch escrow status → 'refunded'
    4. Crée entry ledger type 'refund'
  - `getEscrowByActivation`: query
  - `getActiveEscrows`: query (pour admin)
  - `internalCreatePendingEscrow`: internalMutation, crée escrow status='pending'
  - `internalConfirmHeldEscrow`: internalMutation, passe pending → held
  - `cleanupOrphanedEscrows`: internalMutation (pour scheduler uniquement)
    - (CORRIGÉE : était `mutation`, passe à `internalMutation` car scheduler-only)
    - Expire les pending > 5 min
- **Dépend de:** Step 1 (table `escrows`), Step 4 (`wallet.ts`)
- **Risque:** Si `releaseEscrow` et `refundEscrow` sont appelés simultanément sur le même escrow, un seul passe grâce à l'atomicité de la mutation. Tester. Également, le calcul de `marginCents` dépend de `providerCostCents` qui doit être défini avant release.

---

## Step 7 — Créer le module orders.ts

- **Fichiers:** `convex/orders.ts`
- **Résultat attendu:** Module avec :
  - `internalCreateOrder`: internalMutation, crée une order avec type, status, amounts
  - `listOrders`: query utilisateur (paginée)
  - `listAllOrders`: query admin
- **Dépend de:** Step 1 (table `orders`)
- **Risque:** Aucun (module simple, appelé par payment_intents et escrows).

---

## Step 8 — Ajouter le nouveau webhook /payment/webhook dans http.ts

- **Fichiers:** `convex/http.ts`
- **Résultat attendu:** Nouveau handler `POST /payment/webhook` qui coexiste avec `/fapshi-webhook`.

### Contexte Convex (HTTP = Action)

**IMPORTANT:** Les endpoints HTTP Convex sont TOUJOURS des actions (https://docs.convex.dev/functions/http-actions). Ils n'ont PAS accès à `ctx.db`. Tout accès DB passe par `ctx.runMutation()` ou `ctx.runQuery()`.

```ts
// Le handler HTTP est une action — il reçoit un Request et retourne un Response :
export const paymentWebhook = httpAction(async (ctx, request) => {
  const payload = await request.json();
  // ctx.db n'existe PAS ici — utiliser ctx.runMutation()
  await ctx.runMutation(internal.payment_intents.confirmPaymentIntent, {
    gatewayTransactionId: payload.transId
  });
  return new Response('OK', { status: 200 });
});
```

### Détail du handler

- Il appelle `ctx.runMutation(internal.payment_intents.confirmPaymentIntent, { gatewayTransactionId })` (idempotent)
- L'ancien endpoint est conservé mais marqué `@deprecated`
- **Pourquoi action ?** Les webhooks HTTP Convex sont obligatoirement des `httpAction`. Cf. `convex/http.ts` et https://docs.convex.dev/functions/http-actions.

- **Dépend de:** Step 5 (`payment_intents.ts` avec `confirmPaymentIntent`)
- **Risque:** Pendant la transition, les deux webhooks sont actifs. S'assurer que le nouveau handler utilise `confirmPaymentIntent` idempotent → double traitement impossible.

**Coexistence transition:** L'ancien endpoint `/fapshi-webhook` (handler `handlePaymentSuccess`) est conservé pendant la transition mais doit être désactivé avant la suppression du module `purchases.ts`. Avant Step 20 (suppression modules legacy), modifier `handlePaymentSuccess` pour retourner HTTP 410 Gone avec un message explicite. Cela évite que des webhooks Fapshi résiduels ne tentent d'appeler le code legacy supprimé.

---

## Step 9 — Tests backend (wallet, payment_intents, escrows)

- **Fichiers:**
  - NOUVEAU: `convex/tests/test_wallet.ts`
  - NOUVEAU: `convex/tests/test_payment_intents.ts`
  - NOUVEAU: `convex/tests/test_escrows.ts`
- **Résultat attendu:** Tests unitaires qui valident :
  - credit + debit = balance correcte, debit > balance → throw
  - confirmPaymentIntent appelé 2x → idempotent (second appel retourne existing)
  - releaseEscrow puis refundEscrow sur même escrow → second throw
  - refundEscrow puis releaseEscrow sur même escrow → second throw
  - holdEscrow avec solde insuffisant → throw
- **Dépend de:** Steps 4-7 (wallet, payment_intents, escrows, orders)
- **Risque:** Faible (tests séparés, pas de prod impact)
- **Note:** Convex ne supporte pas Jest. Utiliser `npx convex run` avec des mutations de test ou un script `convex/test_helpers.ts`.

---

## Step 10 — Créer les hooks frontend wallet (use-wallet.ts + query keys)

- **Fichiers:**
  - NOUVEAU: `src/components/wallet/hooks/use-wallet.ts`
  - NOUVEAU: `src/components/wallet/hooks/index.ts`
  - NOUVEAU: `src/components/wallet/docs/CONTINUE.md`
  - NOUVEAU: `src/components/wallet/docs/CHANGELOG.md`
  - NOUVEAU: `src/components/wallet/docs/TODOS.md`
- **Résultat attendu:** Factory `walletKeys` + hooks :
  - `walletKeys.all`, `walletKeys.balance()`, `walletKeys.transactions()`, `walletKeys.orders()`
  - `useWalletBalance()` → `useQuery(convexQuery(api.wallet.getBalance, {}))`
  - `useWalletLedger()` → `useQuery(convexQuery(api.wallet.getLedger, {}))`
  - `useOrders()` → `useQuery(convexQuery(api.orders.listOrders, {}))`
  - `useCreatePaymentIntent()` → mutation (appelle `api.payment_intents.initiatePayment` — action via client)
  - `useConfirmPaymentIntent()` → mutation
  - `useVerifyPaymentIntent()` → action (appelle `api.payment_intents.verifyPaymentIntent`)
  - `useCancelPaymentIntent()` → mutation
- **Résultat attendu (suite) — Invalidations React Query:**

  | Mutation | Keys à invalider |
  |----------|-----------------|
  | `createPaymentIntent` | `walletKeys.all` |
  | `confirmPaymentIntent` | `walletKeys.balance()`, `walletKeys.transactions()` |
  | `holdEscrow` | `walletKeys.balance()`, `escrowKeys.all` |
  | `releaseEscrow` / `refundEscrow` | `walletKeys.balance()`, `walletKeys.transactions()`, `escrowKeys.all` |

- **Bridge barrel temporaire:** Ajouter dans `src/components/purchases/hooks/index.ts`:
  ```ts
  export { useWalletBalance as useBalance } from '@/components/wallet/hooks'
  export { useWalletLedger as useMouvements } from '@/components/wallet/hooks'
  ```
  Cela permet aux consommateurs legacy (navigation, etc.) de continuer à fonctionner sans modification immédiate.

- **Discussion optimistic updates:** Utiliser `withOptimisticUpdate` pour les mutations non-financières (`createPaymentIntent`) — l'utilisateur voit immédiatement un état "pending". NE PAS utiliser d'optimistic update pour les mutations financières (`holdEscrow`, `releaseEscrow`, `refundEscrow`) — le risque d'afficher un solde incorrect est trop élevé. Pour ces mutations, l'utilisateur attend la confirmation backend.

- **Dépend de:** Steps 4-7 (backend wallet, payment_intents, orders existent)
- **Risque:** Aucun (nouveaux hooks, pas encore consommés).

---

## Step 11 — Adapter le flux recharge (frontend)

- **Fichiers:**
  - `src/components/recharge/recharge-drawer.tsx` (réécrire <100 lignes)
  - `src/components/recharge/step-topup.tsx` (réécrire <200 lignes)
  - `src/components/recharge/step-method.tsx` (conserver, adapter)
  - `src/components/recharge/payment-methods.ts` (conserver ou supprimer)
  - `src/components/layout/panels/recharge-panel.tsx` (consommateur `useInitiateDirectPay` → `useCreatePaymentIntent`)
  - `src/components/layout/mobile-bottom-nav.tsx` (consommateur `useInitiateDirectPay` + `useBalance` → `useCreatePaymentIntent` + `useWalletBalance`)
- **Résultat attendu:** `recharge-drawer.tsx` utilise `useCreatePaymentIntent()` au lieu de `useInitiateDirectPay()`. `step-topup.tsx` utilise le taux depuis `convex/config.ts` via une query au lieu de `XAF_RATE = 600` hardcodé. `recharge-panel.tsx` et `mobile-bottom-nav.tsx` sont mis à jour pour utiliser les nouveaux hooks. Le flux reste identique pour l'utilisateur mais utilise les nouvelles tables.
- **Dépend de:** Step 10 (hooks wallet disponibles)
- **Risque:** Changement d'API → tester que la redirection Fapshi fonctionne toujours. Le retour utilisateur vers `/payment/result` doit être adapté (voir Step 14).

---

## Step 12 — Adapter les composants wallet (frontend)

- **Fichiers:**
  - `src/components/wallet/wallet-page-shell.tsx` (réécrire <100 lignes)
  - `src/components/wallet/wallet-purchase-history.tsx` (remplacer par order history)
  - `src/components/wallet/wallet-transaction-list.tsx` (réécrire mapping `TransactionItem` pour `WalletLedgerEntry` — voir spec ci-dessous)
  - `src/components/wallet/wallet-balance-card.tsx` (adapter props pour accepter `balanceUsd` + `balanceCents`)

- **Résultat attendu:** `wallet-page-shell.tsx` utilise `useWalletBalance()` et `useWalletLedger()` au lieu des hooks legacy. `wallet-purchase-history.tsx` utilise `useOrders()` au lieu de `usePurchases()`. Interface utilisateur inchangée.

- **Spec mapping TransactionItem → WalletLedgerEntry:**
  ```ts
  // Ancien (legacy) :
  // amountXaf: Math.round(m.montant * 600),  // m.montant en USD float
  // credit: m.sens === 'debit' ? m.montant : 0,
  // debit: m.sens === 'credit' ? m.montant : 0,
  // soldeApres: m.soldeApres,
  // kind: 'purchase',
  // statut: m.statut,
  //
  // Nouveau (WalletLedgerEntry) :
  // amountCents: entry.amountCents (cents entiers)
  // amountXaf: Math.round(entry.amountCents / 100 * xafRate)
  // credit: entry.type === 'credit' || entry.type === 'refund' ? entry.amountCents : 0
  // debit: entry.type === 'debit' || entry.type === 'release' ? entry.amountCents : 0
  // soldeApres: entry.balanceAfterCents / 100  // en USD pour backward compat
  // kind: entry.referenceType,
  // statut: 'confirmed'  // toujours confirmé dans le ledger immutable
  ```

- **Backward compat `balanceUsd`:** La réponse de `useWalletBalance()` doit contenir le champ `balanceUsd: number` (même nom) pour ne pas casser les 5 consommateurs existants : `desktop-header.tsx`, `wallet-page-shell.tsx`, `activation-detail.tsx`, `mobile-bottom-nav.tsx`, `purchase-panel.tsx`. Ajouter aussi `balanceCents: number` pour le nouveau code.
  ```ts
  // Réponse useWalletBalance() :
  // { balanceUsd: wallet.balanceCents / 100, balanceCents: wallet.balanceCents, userId: string }
  ```

- **Dépend de:** Step 10 (hooks wallet disponibles)
- **Risque:** Les types changent (TransactionItem → WalletLedgerEntry). Vérifier le mapping dans `wallet-page-shell.tsx`.

---

## Step 13 — Créer les nouveaux composants admin

- **Fichiers:**
  - NOUVEAU: `src/components/admin/wallets/admin-wallets.tsx`
  - NOUVEAU: `src/components/admin/payment-intents/admin-payment-intents.tsx`
  - NOUVEAU: `src/components/admin/orders/admin-orders.tsx`
  - NOUVEAU: `src/components/admin/ledger/admin-ledger.tsx`
  - `src/components/admin/admin-layout.tsx` (ajouter onglets wallets, payment-intents, orders, ledger)
  - `src/components/admin/hooks/use-admin-queries.ts` (ajouter nouveaux hooks admin wallet/ledger/payment_intents/orders)
- **Fichiers supplémentaires:**
  - `convex/margins.ts` (NOUVEAU — découpler de `comptabilite.ts` avant suppression)
  - `convex/margin_tiers.ts` (NOUVEAU — découpler de `comptabilite.ts` avant suppression)
- **Résultat attendu:** L'admin peut voir wallets, ledger entries, payment intents et orders via les nouveaux composants. Les anciens onglets `purchases` et `accounting` coexistent encore. Les modules `margins.ts` et `margin_tiers.ts` sont extraits de la dépendance vers `comptabilite.ts` pour permettre la suppression future de ce dernier.
- **Dépend de:** Steps 4-7 (backend), Step 10 (hooks)
- **Risque:** Aucun (nouveau code, coexistence avec l'ancien).

---

## Step 14 — Réécrire la route payment/result.tsx

- **Fichiers:** `src/routes/payment/result.tsx`
- **Résultat attendu:** La route utilise `useVerifyPaymentIntent()` au lieu de `useVerifyPurchase()`. Ne lit plus `status` depuis l'URL comme source de vérité — fait toujours la vérification via le backend. Le `transId` (gatewayTransactionId) est le seul paramètre nécessaire.
- **Dépend de:** Step 10 (hooks disponibles)
- **Risque:** Changement de comportement. Si le `transId` manque, l'utilisateur voit 'no_transaction' (comportement legacy).

**Correction legacy — empty deps array:** Le `useEffect` de `payment/result.tsx` a un tableau de dépendances vide (ligne 86, avec `// eslint-disable-next-line react-hooks/exhaustive-deps`). Ajouter les dépendances manquantes : `transId`, `verifyPurchase`/`verifyPaymentIntent`, `onSuccess`, `onError`. Cela évite les stale closures.

---

## Step 15a — Adapter purchase-panel.tsx (balance wallet uniquement)

- **Fichiers:**
  - `src/components/my-space/purchase-panel.tsx` (réécrire <200 lignes)
  - `src/components/my-space/constants.ts` (supprimer `XAF_USD_RATE`)
- **Résultat attendu:** `purchase-panel.tsx` utilise `useWalletBalance()` pour le solde. Pas de changement escrow.
- **Dépend de:** Step 10 (hooks wallet)
- **Risque:** Faible (purchase-panel seulement, pas de changement escrow)

---

## Step 15b — Adapter activation-detail.tsx aux nouveaux escrows

- **Fichiers:**
  - `src/components/my-space/activation-detail.tsx` (adapter <200 lignes)
- **Résultat attendu:** activation-detail utilise les hooks escrow mis à jour (releaseEscrow, refundEscrow via les nouvelles mutations backend).
- **Dépend de:** Step 19 (bascule sms_provider)
- **Risque:** Le flux d'activation complet doit être testé de bout en bout. Si `holdEscrow` échoue (solde insuffisant), l'activation ne doit pas être créée.

---

## Step 16 — Migration 1: Escrows actifs (priorité haute)

- **Fichiers:**
  - NOUVEAU: `convex/migrations/backfill_escrows.ts`
  - `package.json` (ajouter `@convex-dev/migrations` si pas déjà)
- **Résultat attendu:** Migration qui :
  1. Pour chaque activation active (`awaiting_number`, `awaiting_sms`, `sms_received`), lit le montant dans `pieces(471-{activationId})` / `lignes`
  2. Crée `escrows(userId, activationId, amountCents=priceCharged, status='held')`
  3. Vérifie qu'il n'y a pas de doublon (idempotent)
  - Script dry-run d'abord : `npx convex run migrations:backfillEscrows '{"dryRun": true}'`
  - Vérification : `count(activations actives) === count(escrows(held))`
- **Dépend de:** Step 1 (table `escrows`), Step 6 (module `escrows.ts` exports internalCreateEscrow)
- **Risque:** CRITIQUE. Si une activation en cours n'a pas d'escrow migré, l'activation ne pourra pas être complétée après la bascule. Tester sur une copie de prod avant.

---

## Step 17 — Migration 2: Wallets + ledger entries + payment_intents + orders

- **Fichiers:**
  - NOUVEAU: `convex/migrations/backfill_wallets.ts`
  - NOUVEAU: `convex/migrations/backfill_ledger.ts`
  - NOUVEAU: `convex/migrations/backfill_payment_intents.ts`
- **Résultat attendu:**

  **backfill_wallets.ts:**
  - Pour chaque document dans `comptes(code=411-{userId})` unique :
    1. Crée `wallets(userId, balanceCents=Math.round(solde * 100), currency='USD')`
    2. Si pas de compte 411, créer wallet avec balanceCents: 0
  - Pour chaque `users` avec `balanceUsd` défini mais sans wallet → créer wallet
  - Vérification : `sum(comptes(411-*).solde * 100) === sum(wallets.balanceCents)`

  **backfill_ledger.ts:**
  - Pour chaque `ligne` liée à un compte `411-{userId}` :
    1. Déterminer type (sens='debit' → 'credit' wallet, sens='credit' → 'debit' wallet)
    2. Déterminer referenceType/referenceId depuis `pieces.reference`
    3. Créer `wallet_ledger_entry` avec `balanceAfterCents` = legacy `soldeApres` * 100
  - Avec pagination (`.take(500)` loop) pour éviter limite 32000

  **backfill_payment_intents.ts:**
  - Pour chaque `purchases` :
    - Normaliser le statut legacy : `['confirmed', 'SUCCESSFUL', 'successful'].includes(status.toLowerCase())` → status='succeeded'. Les statuts legacy sont un `v.string()` libre et peuvent varier en casse.
    - Utiliser `idempotencyKey` s'il existe, sinon utiliser `paymentGatewayId` comme fallback (les anciennes purchases peuvent ne pas avoir `idempotencyKey`).
  - Pour chaque `purchases` avec statut normalisé 'succeeded':
    1. Créer `payment_intents(userId, amountCents=round(priceXaf/xafRate), status='succeeded', idempotencyKey, gatewayTransactionId=paymentGatewayId)`
    2. Créer `order(userId, type='recharge', status='completed', paymentIntentId, amountCents)`
  - Pour chaque `purchases` avec statut ≠ 'succeeded':
    1. Créer `payment_intents(userId, amountCents, status=mappedStatus)`
    2. Créer `order(userId, type='recharge', status=mappedStatus, paymentIntentId)`

- **Correction backfill_ledger.ts — soldeApres:**
  - Si `soldeApres` est présent dans la ligne legacy → utiliser `Math.round(soldeApres * 100)` pour `balanceAfterCents`
  - Si `soldeApres` est absent → calculer récursivement depuis le solde du wallet précédent (trouver la dernière entry du wallet et utiliser son `balanceAfterCents` comme point de départ, puis appliquer le montant courant)

- **Réutilisation backfillComptes:** La logique de `backfillComptes` (purchases.ts:468-507) qui itère les purchases et crée des écritures peut être réutilisée dans `backfill_payment_intents.ts` au lieu de tout réécrire. Copier/adapter cette logique avant la suppression de `purchases.ts`.

- **Dépend de:** Steps 16 (escrows faits en premier, car les wallets dépendent des soldes legacy), Steps 1-7 (tables et modules existent)
- **Risque:** Les données legacy peuvent avoir des formats inattendus (userId manquant, montant NaN, `soldeApres` absent). Logguer chaque échec et continuer. Rapport final avec succès/échecs.

---

## Step 18 — Vérifications d'intégrité post-migration

- **Fichiers:** Aucun (script à exécuter en console Convex ou queries ad-hoc)
- **Résultat attendu:** Toutes les vérifications passent :
  1. `sum(wallets.balanceCents) + sum(escrows(held).amountCents) === sum(comptes(411-*).solde * 100)` (conservation valeur)
  2. Toute activation active a un escrow associé
  3. Aucun wallet orphelin (sans utilisateur correspondant)
  4. Aucune `wallet_ledger_entry` sans wallet parent
  5. `count(purchases réussies) === count(payment_intents(succeeded))`
  6. `count(purchases) === count(orders)`
  7. Dernier `balanceAfterCents` de chaque wallet === `wallet.balanceCents`
- **Dépend de:** Steps 16-17 (migrations exécutées)
- **Risque:** Si une vérification échoue, NE PAS procéder à la suppression legacy. Corriger la migration et ré-exécuter.

---

## Step 19 — Bascule sms_provider.ts + activations vers les nouveaux escrows

- **Fichiers:**
  - `convex/sms_provider.ts` (modifier les fonctions concernées)
  - `convex/activations.ts` (NOUVEAU — extraire la logique activation de sms_provider.ts pour respecter <200 lignes)
  - `convex/admin/sync.ts` (NOUVEAU — extraire `syncPrices` de sms_provider.ts)
- **Résultat attendu:** 
  - `initiateActivation` n'utilise plus `comptabilite.ensureCompte`/`createPiece` pour l'escrow. À la place, elle appelle `internalCreatePendingEscrow`, appelle le provider, puis `internalConfirmHeldEscrow`.
  - `completeActivation` n'utilise plus `annulerPiece`/`createPiece`. Elle appelle `releaseEscrow`.
  - `cancelActivation` n'utilise plus `annulerPiece`/`createPiece`. Elle appelle `refundEscrow`.
  - Les `scheduler.runAfter` sont mis à jour pour appeler les nouvelles mutations.
  - Le module `activations.ts` est extrait de `sms_provider.ts` (qui fait 1231 lignes) pour respecter la limite de 200 lignes. `sms_provider.ts` conserve les appels API provider pur.

- **Audit scheduler.runAfter:** 15 appels `scheduler.runAfter` dans `sms_provider.ts` (lignes 131, 196, 244, 273, 377, 381, 458, 493, 523, 949, 1021, 1082, 1087, 1104, 1218). Pour chacun, vérifier que la fonction schedulée pointe vers la nouvelle mutation escrow (dans `activations.ts` ou `escrows.ts`). Remplacer les références aux anciennes fonctions comptables.

- **Déploiement en 2 phases:**
  - **Phase 1 (drain):** Déployer une version de `sms_provider.ts` qui arrête de scheduler de NOUVEAUX jobs (les `scheduler.runAfter` sont commentés ou conditionnés par un flag). Les jobs existants continuent de s'exécuter et se drainent naturellement. Attendre 5 min (timeout max des jobs).
  - **Phase 2 (bascule):** Déployer le nouveau code avec les références vers `activations.ts` et `escrows.ts`. Les nouveaux jobs utilisent les nouvelles mutations.

- **Correction double appel refundEscrow:** `cancelActivation` (ligne 454) appelle `refundEscrow` DIRECTEMENT puis schedule `cancelActivationAction` (ligne 458) qui ré-appelle `refundEscrow`. Supprimer l'appel `refundEscrow` dans `cancelActivation` (ligne 454). Ne garder l'appel QUE dans `cancelActivationAction` (ligne 1225). La machine à états escrow avec `internalRefundEscrow` idempotent empêchera le double refund, mais il faut éviter l'appel API SMS Online Pro superflu.

- **Déplacement RENT_DURATIONS_HOURS:** Déplacer le tableau `RENT_DURATIONS_HOURS` (lignes 713-744) de `sms_provider.ts` vers le nouveau module `activations.ts`. Ce tableau de 30+ entrées est utilisé par `getRentPriceList` (ligne 750). Mettre à jour l'import dans `sms_provider.ts`.

- **Extraction syncPrices:** Extraire `syncPrices` (action admin) de `sms_provider.ts` vers un module dédié `convex/admin/sync.ts`. Cette action référence `internal.purchases.internalGetUserByBetterAuthId` — une fois migrée vers `users.ts` (Step 5 clarifications), mettre à jour la référence.

- **Dépend de:** Step 6 (escrows.ts), Steps 16-17 (migrations faites)
- **Risque:** ÉLEVÉ. Les jobs scheduler déjà en file d'attente avant déploiement appellent l'ancien code. La mitigation en 2 phases (drain puis bascule) réduit ce risque.

---

## Step 20 — Supprimer les modules Convex legacy

- **Fichiers:**
  - SUPPRIMER: `convex/comptabilite.ts`
  - SUPPRIMER: `convex/purchases.ts`
  - SUPPRIMER: `convex/packages.ts`
- **Résultat attendu:** Les 3 modules n'existent plus. Tout le code qui les référençait a été migré vers les nouveaux modules. `npx convex deploy` passe (les fonctions ne sont plus référencées nulle part).
- **Dépend de:** Steps 1-19 (tout le nouveau code est déployé et fonctionnel)
- **Risque:** Vérifier avec `grep -r "api\.(purchases|comptabilite|packages)\."` qu'aucune référence ne subsiste. Si une référence existe — erreur de compilation Convex.

**Vérification pré-suppression:**
1. Vérifier que `internalGetUserByBetterAuthId`, `internalCreateUser`, `internalUpdateUserDeposit` ont été migrés de `purchases.ts` vers `users.ts` (Step 5 clarifications). Ces fonctions sont appelées par `sms_provider.ts:659` (syncPrices) et `verifyPurchase:440`.
2. Vérifier que la logique de `backfillComptes` (purchases.ts:468-507) a été copiée dans `backfill_payment_intents.ts` (Step 17).
```bash
grep -r "api\.purchases\." convex/ src/ --include="*.ts" --include="*.tsx" | grep -v "_generated" | grep -v "node_modules"
grep -r "api\.comptabilite\." convex/ src/ --include="*.ts" --include="*.tsx" | grep -v "_generated" | grep -v "node_modules"
grep -r "api\.packages\." convex/ src/ --include="*.ts" --include="*.tsx" | grep -v "_generated" | grep -v "node_modules"
```

---

## Step 21 — Supprimer les tables legacy du schéma Convex

- **Fichiers:**
  - `convex/schema.ts` (supprimer `comptes`, `pieces`, `lignes`, `purchases`, `packages` du `defineSchema`)
  - `convex/schema.ts` (supprimer `users.balanceUsd`, `users.hasMadeDeposit`)
  - `convex/users.ts` (supprimer `balanceUsd: 0` dans `syncUser` — ligne 62. Si oublié, `users.balanceUsd` continue d'être initialisé même après suppression du champ → erreur Convex)
  - `convex/auth.ts` (même correction : supprimer `balanceUsd: 0` dans la création d'utilisateur)
- **Résultat attendu:** Les tables et champs legacy ne sont plus dans le schéma. Aucun code ne tente d'écrire `users.balanceUsd`. Déploiement avec `--type=forceWithSchemaChanges` pour confirmer la suppression.
- **Dépend de:** Step 20 (modules legacy supprimés)
- **Risque:** IRREVERSIBLE. Les données sont définitivement perdues. Vérifier que toutes les migrations sont terminées avec succès avant cette étape. Faire un backup Convex avant.

---

## Step 22 — Supprimer les hooks et composants frontend legacy

- **Fichiers:**
  - SUPPRIMER ou réécrire: `src/components/purchases/hooks/use-purchases.ts`
  - `src/components/purchases/hooks/index.ts` (retirer les exports legacy, ne garder que use-activations)
  - SUPPRIMER: `src/components/admin/accounting/admin-accounting.tsx`
  - SUPPRIMER: `src/components/admin/purchases/admin-purchases.tsx`
  - SUPPRIMER: `src/components/admin/packages/admin-packages.tsx`
  - `src/components/admin/admin-layout.tsx` (retirer les imports et onglets supprimés)
- **Résultat attendu:** Plus aucune référence aux hooks/composants legacy dans le frontend. Les pages admin utilisent les nouveaux composants (wallets, payment_intents, orders, ledger).
- **Dépend de:** Steps 10-15a (nouveaux hooks/composants existent), Steps 11-12 (composants réécrits)
- **Risque:** `grep` exhaustif AVANT suppression pour trouver tout consommateur oublié.

---

## Step 23 — Supprimer éléments frontend morts + nettoyage final

- **Fichiers:**
  - SUPPRIMER: `src/components/recharge/payment-methods.ts` (plus nécessaire si API-driven)
  - SUPPRIMER: `src/components/wallet/wallet-purchase-history.tsx` (remplacé)
  - Mettre à jour `src/components/purchases/hooks/index.ts` (ne garder que les hooks activation, le bridge wallet est déjà en place depuis Step 10)
- **Résultat attendu:** Codebase nettoyée de tout le legacy. Plus de `XAF_RATE` dupliqué. Tous les fichiers respectent la limite de 200 lignes.
- **Dépend de:** Steps 1-22
- **Risque:** Aucun si les vérifications préalables sont faites.

---

## Step 24 — Vérifications finales post-narrow

- **Fichiers:** Aucun (exécution de vérifications)
- **Résultat attendu:** 

  **Backend:**
  - [ ] `npx convex deploy --type=forceWithSchemaChanges` passe
  - [ ] Toutes les queries/mutations/actions des nouveaux modules fonctionnent
  - [ ] Le webhook `/payment/webhook` répond HTTP 200
  - [ ] L'ancien endpoint `/fapshi-webhook` n'existe plus (ou retourne 410 Gone)
  - [ ] Aucune référence à `comptes`, `pieces`, `lignes`, `purchases`, `packages` dans le code
  - [ ] Les jobs scheduler pointent vers les nouvelles mutations
  - [ ] `npx convex run --help` montre toutes les nouvelles fonctions

  **Frontend:**
  - [ ] La recharge Fapshi fonctionne de bout en bout
  - [ ] L'activation SMS fonctionne de bout en bout
  - [ ] Le wallet affiche le bon solde
  - [ ] L'historique des transactions s'affiche correctement
  - [ ] L'admin voit les nouveaux onglets wallets, payment_intents, orders, ledger
  - [ ] Les anciens onglets purchases, accounting, packages ont disparu
  - [ ] `npm run typecheck` passe
  - [ ] `npm run lint` passe

  **Intégrité financière:**
  - [ ] Conservation valeur : `sum(wallets.balanceCents) + sum(escrows(not refunded).amountCents) === sum(comptes(411).solde * 100)` (legacy avant suppression)
  - [ ] Balances wallets non négatives
  - [ ] Aucun escrow orphelin
  - [ ] `sum(payment_intents(succeeded).amountCents) - sum(escrows(released).amountCents) - sum(wallets.balanceCents) - sum(escrows(held).amountCents) + sum(escrows(refunded).amountCents) === 0`

- **Dépend de:** Steps 1-23
- **Risque:** Si une vérification échoue, bloquer le déploiement et investiguer.

---

## Graphe de Dépendances

```
Step 1 (schema) ──┬── Step 2 (config) ── Step 3 (provider_ops)
                  │
                  ├── Step 4 (wallet.ts) ──┬── Step 5 (payment_intents.ts) ── Step 8 (http.ts)
                  │                        │
                  │                        ├── Step 9 (tests backend)
                  │                        │
                  │                        └── Step 6 (escrows.ts) ──┬── Step 15a (frontend balance wallet)
                  │                                                 │
                  │                                                 ├── Step 15b (frontend escrow)
                  │                                                 │
                  │                                                 └── Step 19 (sms_provider bascule)
                  │
                  ├── Step 7 (orders.ts) ──┐
                  │                         │
                  └── Step 10 (frontend hooks) ──┬── Step 11 (recharge)
                                                  ├── Step 12 (wallet)
                                                  ├── Step 13 (admin)
                                                  └── Step 14 (payment/result)

Step 16 (migration escrows) ── Step 17 (migration wallets+ledger+purchases) ── Step 18 (vérifications)
                                                                                     │
                                                     Step 19 (sms_provider bascule) │
                                                                                     │
Step 20 (suppression modules legacy) ←───────────────────────────────────────────────┘
         │
Step 21 (suppression tables legacy)
         │
Step 22 (suppression hooks/composants legacy)
         │
Step 23 (nettoyage final)
         │
Step 24 (vérifications finales)
```

---

## Analyse des Risques par Step

| Step | Risque | Mitigation |
|------|--------|------------|
| 1 | Aucun | Tables ajoutées sans suppression |
| 2 | Taux par défaut incorrect | Valeur par défaut = 600 (identique à l'ancien) |
| 3 | Aucun | Module inutilisé au départ |
| 4 | Incohérence ledger si bug | Mutation atomique, test credit+debit |
| 5 | ⚠️ Action écrit dans DB sans `ctx.runMutation()` | **CORRIGÉ :** plan explicite sur l'utilisation de `ctx.runMutation()` dans les actions. Ajout de `internalMarkPaymentProcessing` et `internalMarkPaymentFailed`. |
| 5 | `mutation` utilisée au lieu de `internalMutation` pour scheduler | **CORRIGÉ :** `expireOrphanedPaymentIntents` passe en `internalMutation` |
| 6 | `mutation` utilisée au lieu de `internalMutation` pour scheduler | **CORRIGÉ :** `cleanupOrphanedEscrows` passe en `internalMutation` |
| 7 | Aucun | Module simple |
| 8 | Double webhook | confirmPaymentIntent idempotent |
| 9 | Faible | Tests séparés, pas de prod impact |
| 10 | Aucun | Nouveaux hooks non consommés |
| 11 | Redirection Fapshi cassée | Tester manuellement |
| 12 | Types incompatibles | TypeScript détectera |
| 13 | Aucun | Coexistence avec ancien |
| 14 | transId manquant | Fallback 'no_transaction' |
| 15a | Faible | purchase-panel seulement, pas de changement escrow |
| 15b | Flux activation cassé | Tester complet |
| 16 | CRITIQUE: escrows actifs non migrés | Dry-run, test staging |
| 17 | Données legacy mal formées | Logguer échecs, rapport |
| 18 | Échec vérification | Bloquer suppression |
| 19 | Jobs scheduler legacy (15 runAfter) | Phase 1: drain (arrêter scheduling) → Phase 2: bascule après 5 min |
| 20 | Référence non migrée | grep avant suppression |
| 21 | IRREVERSIBLE: perte données | Backup, vérif intégrité |
| 22 | Consommateur oublié | grep exhaustif |
| 23 | Aucun | Code mort déjà identifié |
| 24 | Échec vérification | Bloquer déploiement |

---

## Résumé des corrections appliquées

| # | Fichier | Correction | Raison (doc Convex) |
|---|---------|-----------|---------------------|
| 1 | `payment_intents.ts` — Step 5 | `initiatePayment` (action) : toutes les écritures DB passent par `ctx.runMutation()` | `ctx.db` n'existe pas dans les actions (https://docs.convex.dev/api/interfaces/server.GenericActionCtx) |
| 2 | `payment_intents.ts` — Step 5 | Ajout de `internalMarkPaymentProcessing` (internalMutation) | L'action `initiatePayment` a besoin d'une mutation pour patcher `gatewayTransactionId`/`status` |
| 3 | `payment_intents.ts` — Step 5 | Ajout de `internalMarkPaymentFailed` (internalMutation) | L'action `verifyPaymentIntent` a besoin d'une mutation pour marquer l'échec |
| 4 | `payment_intents.ts` — Step 5 | `expireOrphanedPaymentIntents`: `mutation` → `internalMutation` | Fonction scheduler-only : pas d'appel frontend, doit être `internal` (https://docs.convex.dev/scheduling/scheduled-functions) |
| 5 | `escrows.ts` — Step 6 | `cleanupOrphanedEscrows`: `mutation` → `internalMutation` | Fonction scheduler-only : pas d'appel frontend, doit être `internal` |
| 6 | `http.ts` — Step 8 | Webhook handler : précision explicite que c'est une action avec `ctx.runMutation()` | Les HTTP endpoints Convex sont toujours des `httpAction` (https://docs.convex.dev/functions/http-actions) |
| 7 | Plan global | Ajout Step 9 Tests backend | Reviewer 2 — tests absents (problème bloquant) |
| 8 | Plan global | Éclatement Step 15 en 15a (avant bascule) + 15b (après bascule) | Reviewer 2 — dépendance ordering Step 15 vs Step 19 |
| 9 | `plan.md` — Step 2 | Ajout country-list.tsx, index.ts aux fichiers à modifier | Reviewer 1 — imports cassés après suppression constants.ts |
| 10 | `plan.md` — Step 5 | Migration internalGetUserByBetterAuthId/internalCreateUser/internalUpdateUserDeposit → users.ts | Reviewer 1 — appelées par sms_provider.ts:659, cassées après Step 20 |
| 11 | `plan.md` — Step 5 | Hot document promoCodes → nouvelle table promo_usage | Reviewer 1 — risque hot document si promo populaire |
| 12 | `plan.md` — Step 5 | `ctx.db.runMutation()` → `ctx.runMutation()` | Reviewer 2 — coquille Convex (ctx.db n'existe pas dans internalMutation) |
| 13 | `plan.md` — Step 8 | Coexistence /fapshi-webhook + désactivation via 410 Gone | Reviewer 1 — double écriture pendant transition |
| 14 | `plan.md` — Step 10 | Invalidations React Query détaillées par mutation | Reviewer 2 — invalidations critiques non spécifiées |
| 15 | `plan.md` — Step 10 | Bridge barrel purchases/hooks → wallet/hooks | Reviewer 2 — consommateurs legacy cassés sans bridge |
| 16 | `plan.md` — Step 10 | Discussion optimistic updates (financières ≠ non-financières) | Reviewer 2 — AGENTS.md exige withOptimisticUpdate, mais dangereux pour finances |
| 17 | `plan.md` — Step 11 | Ajout recharge-panel.tsx, mobile-bottom-nav.tsx consommateurs | Reviewer 1 — 2 consommateurs oubliés |
| 18 | `plan.md` — Step 12 | Mapping TransactionItem → WalletLedgerEntry avec conversion XAF | Reviewer 1 — * 600 obsolete, utiliser amountCents/100 * rate |
| 19 | `plan.md` — Step 12 | Backward compat balanceUsd pour 5 consommateurs | Reviewer 1 — contrat d'interface à préserver |
| 20 | `plan.md` — Step 13 | Ajout margins.ts, margin_tiers.ts découplés de comptabilite.ts | Reviewer 2 — dépendance cachée vers module supprimé |
| 21 | `plan.md` — Step 14 | Correction empty deps array useEffect payment/result.tsx | Reviewer 2 — stale closure |
| 22 | `plan.md` — Step 17 | Normalisation statuts legacy (['confirmed','SUCCESSFUL','successful']) | Reviewer 2 — mapping statique 'confirmed' insuffisant |
| 23 | `plan.md` — Step 17 | paymentGatewayId fallback si idempotencyKey absent | Reviewer 2 — anciennes purchases sans idempotencyKey |
| 24 | `plan.md` — Step 17 | soldeApres absent → calcul récursif depuis solde wallet précédent | Reviewer 2 — format legacy variable |
| 25 | `plan.md` — Step 17 | Réutilisation backfillComptes dans backfill_payment_intents.ts | Reviewer 1 — logique supprimée trop tôt |
| 26 | `plan.md` — Step 19 | Audit des 15 scheduler.runAfter dans sms_provider.ts | Reviewer 2 — 15 points de scheduling à vérifier |
| 27 | `plan.md` — Step 19 | Déploiement en 2 phases (drain puis bascule) | Reviewer 2 — mitigation "5 min drain" insuffisante |
| 28 | `plan.md` — Step 19 | Correction double appel refundEscrow (cancelActivation ligne 454) | Reviewer 1 — bug existant dans code actuel |
| 29 | `plan.md` — Step 19 | Déplacement RENT_DURATIONS_HOURS → activations.ts | Reviewer 1 — tableau non migré |
| 30 | `plan.md` — Step 19 | Extraction syncPrices → convex/admin/sync.ts | Reviewer 1 — référence internal.purchases cassée après Step 20 |
| 31 | `plan.md` — Step 20 | Vérification migration internalGetUserByBetterAuthId avant suppression | Reviewer 1 — dépendance cachée |
| 32 | `plan.md` — Step 23 | Retrait doubles constants.ts, purchase-panel.tsx (déjà dans Step 15a) | Correction — éviter duplication |

---

*Rapport généré par agent planning — Phase 5 du workflow TEMPLATE.md.*
*Révisé par convex-review-agent — Vérification des types Convex (action vs mutation vs query vs internalMutation).*
*Prochaine étape : Phase 6 — Revue par 2 agents reviewers.*
