# Rapport d'Analyse : Système de Crédits et Paiements (num_zer0)

## Résumé

Le système de crédits/paiements est **bien architecturé** avec :
- Un **wallet multi-compartiments** (base, bonus, promo)
- Un **système de lots (credit_lot)** avec FIFO et expiration
- Un **système de holds** pour les activations en cours
- Un **provider de paiement unique : Fapshi** (agrégateur MTN MoMo, Orange Money)
- Un **mécanisme de shadow pricing** pour les coûts des activations

---

## 1. Schémas de Base de Données (Drizzle)

### 1.1 Tables Crédits — `src/database/schemas/credits.ts`

| Table | Colonnes principales | Rôle |
|-------|---------------------|------|
| `credit_package` | id, slug, credits, priceXaf, bonusPct, isActive, allowedPaymentMethods | Forfaits d'achat |
| `credit_wallet` | id, userId, baseBalance, bonusBalance, promoBalance, heldBalance, totalPurchased/Consumed/Refunded | Wallet utilisateur |
| `credit_lot` | id, walletId, creditType, initialAmount, remainingAmount, expiresAt | Lots de crédits (FIFO) |
| `credit_hold` | id, userId, walletId, activationId, amount, creditType, lotId, state, expiresAt, idempotencyKey | Holds pour activations |
| `credit_transaction` | id, userId, walletId, type, creditType, amount, balanceAfter, purchaseId, lotId, holdId | Journal des transactions |
| `credit_purchase` | id, userId, packageId, status, creditsBase, creditsBonus, totalCredits, priceXaf, paymentMethod, paymentRef, checkoutUrl | Achats de crédits |
| `credit_adjustment_approval` | id, requesterId, targetUserId, amount, status, approverId | Approbations d'ajustement |

### 1.2 Tables Paiements — `src/database/schemas/payments.ts`

| Table | Colonnes principales | Rôle |
|-------|---------------------|------|
| `customer` | id, userId, provider, providerCustomerId | Clients chez providers externes |
| `subscription` | id, userId, provider, providerSubscriptionId, status, plan, amount | Abonnements |
| `payment` | id, userId, provider, providerPaymentId, type, status, amount, currency | Transactions financières |

### 1.3 Enums — `src/database/schemas/enums.ts`

```typescript
creditTypeEnum:        'base' | 'bonus' | 'promotional'
creditTxnTypeEnum:     'purchase' | 'debit' | 'refund' | 'bonus_signup' | ...
creditHoldStateEnum:   'held' | 'debited' | 'released' | 'expired'
purchaseStatusEnum:    'initiated' | 'payment_pending' | 'confirmed' | 'credited' | 'failed' | 'refunded'
paymentMethodEnum:     'mtn_momo' | 'orange_money' | 'card' | 'bank_transfer' | 'crypto' | 'free'
```

Note : `paymentMethodEnum` inclut `card`, `bank_transfer`, `crypto` mais seul
`mtn_momo` et `orange_money` sont utilisés via Fapshi.

---

## 2. Services

### 2.1 CreditLedgerService — `src/services/credit-ledger.service.ts`

| Méthode | Rôle |
|---------|------|
| `getOrCreateWallet(userId)` | Crée un wallet si inexistant |
| `getBalance(userId)` | Retourne WalletBalance via vue SQL `user_wallet_summary` |
| `holdCredits(params)` | Hold via procédure `get_consumable_lots()`, insert `credit_hold` |
| `confirmHoldDebit(holdId)` | Marque un hold comme 'debited' (SMS reçu) |
| `releaseHoldByActivationId(activationId)` | Release tous les holds d'une activation |
| `releaseHoldsByIdempotencyKey(key)` | Release par idempotency |
| `releaseHold(holdId)` | Release un hold spécifique |
| `creditWallet(params)` | Ajoute des crédits (lots base + bonus), crée transactions |
| `getTransactionHistory(userId)` | Historique des 50 dernières transactions |

**Points clés du wallet :**
- Vue SQL `user_wallet_summary` pour les balances
- Procédure PostgreSQL `get_consumable_lots()` pour FIFO
- Holds sur les lots (pas sur le wallet directement)
- Idempotency sur les holds et crédits

### 2.2 PaymentPurchaseService — `src/services/payment-purchase.service.ts`

| Méthode | Rôle |
|---------|------|
| `createPendingPurchase(input)` | Crée un achat avec idempotency |
| `initiateFapshiPayment(purchaseId)` | Génère un lien de paiement Fapshi |
| `verifyAndSyncPurchase(identifier)` | Vérifie statut auprès de Fapshi |
| `confirmPurchaseAndCredit(purchaseId)` | Confirme et crédite le wallet |
| `confirmPurchaseFromWebhook(paymentRef)` | Webhook → confirmation |
| `markPurchaseFailed(purchaseId, reason)` | Marque comme échoué |

### 2.3 ActivationService — `src/services/activation.service.ts`

(voir rapport Grizzly pour les détails d'activation)

### 2.4 PricingResolverService — `src/services/pricing-resolver.service.ts`

(voir rapports Grizzly et Services)

---

## 3. Provider de Paiement : Fapshi

### 3.1 Architecture Fapshi

```
Client → PaymentPurchaseService → FapshiClient → https://sandbox.fapshi.com (ou live)
```

**Fichiers Fapshi :**
| Fichier | Rôle |
|---------|------|
| `src/services/fapshi/client.ts` | Client API (generateLink, directPay, getStatus, ...) |
| `src/services/fapshi/types.ts` | Types (GenerateLinkRequest, Transaction, etc.) |
| `src/services/fapshi/index.ts` | Re-export |
| `app/api/webhooks/fapshi/route.ts` | Webhook Fapshi |

### 3.2 Fonctionnalités Fapshi utilisées

1. **`generateLink()`** — Génère un lien de paiement (utilisé pour les achats)
2. **`getStatus()`** — Vérifie le statut d'une transaction
3. **`directPay()`** — Paiement direct (non utilisé actuellement, mais disponible)
4. **`getBalance()`** — Vérifie le solde Fapshi

### 3.3 Méthodes de paiement exposées

**Composant :** `src/component/recharge/payment-methods.ts`

```typescript
export const METHODS = [
  { id: 'mtn_momo', label: 'MTN MoMo', iconSrc: '/mtn-logo.jpg' },
  { id: 'orange_money', label: 'Orange Money', iconSrc: '/orange-logo.png' },
]
```

**Seules 2 méthodes sont actives : MTN MoMo et Orange Money.**
Les méthodes `card`, `bank_transfer`, `crypto` sont dans l'enum mais pas exposées.

---

## 4. Flux d'Achat de Crédits

```
1. User sélectionne un package → CreditPackages API
   GET /api/client/credits/packages

2. User sélectionne méthode de paiement → Checkout
   PaymentPurchaseService.createPendingPurchase()
     → DB: INSERT credit_purchase (status='payment_pending')

3. User est redirigé → Fapshi payment link
   PaymentPurchaseService.initiateFapshiPayment()
     → FapshiClient.generateLink()
     → Retourne checkoutUrl
     → Redirect user

4. Paiement effectué sur Fapshi
   Webhook Fapshi OR redirect back
     → PaymentPurchaseService.confirmPurchaseFromWebhook()
       → verifyAndSyncPurchase() → FapshiClient.getStatus()
       → status='SUCCESSFUL' → DB: status='confirmed'

5. Crédits ajoutés au wallet
   PaymentPurchaseService.confirmPurchaseAndCredit()
     → CreditLedgerService.creditWallet()
       → INSERT credit_lot (base + bonus)
       → UPDATE credit_wallet (baseBalance + bonusBalance)
       → INSERT credit_transaction

6. Frais d'activation débités
   ActivationService → CreditLedgerService.holdCredits()
     → Puis confirmHoldDebit() à la réception du SMS
```

---

## 5. Composants UI Paiements

| Composant | Fichier | Rôle |
|-----------|---------|------|
| PaymentMethods | `src/component/recharge/payment-methods.ts` | Configuration méthodes |
| PaymentMethodCard | `src/component/recharge/payment-method-card.tsx` | UI carte méthode |
| PaymentMethodCheck | `src/component/recharge/payment-method-check.tsx` | UI checkbox méthode |
| PaymentMethodIcon | `src/component/recharge/payment-method-icon.tsx` | Icône méthode |
| PurchaseFlow | `src/component/recharge/purchase-flow.tsx` | Orchestrateur achat |
| StepPackage | `src/component/recharge/step-package.tsx` | Sélection forfait |
| StepMethod | `src/component/recharge/step-method.tsx` | Sélection méthode |
| StepSummary | `src/component/recharge/step-summary.tsx` | Résumé achat |
| StepStepper | `src/component/recharge/step-stepper.tsx` | Stepper UI |
| RechargeDrawer | `src/component/recharge/recharge-drawer.tsx` | Drawer rechargement |
| PaymentConfirmDialog | `src/component/wallet/payment-confirm-dialog.tsx` | Dialog confirmation |

**Pages wallet :**
| Page | Fichier |
|------|---------|
| Wallet page | `app/[locale]/(main)/wallet/page.tsx` |
| Loading state | `app/[locale]/(main)/wallet/loading.tsx` |
| Error state | `app/[locale]/(main)/wallet/error.tsx` |

---

## 6. Routes API Paiements

| Route | Fichier | Méthode |
|-------|---------|---------|
| `GET /api/client/credits/packages` | `app/api/client/credits/packages/route.ts` | Liste forfaits actifs |
| `GET /api/client/credits/balance` | `app/api/client/credits/balance/route.ts` | Balance wallet |
| `GET /api/client/credits/history` | `app/api/client/credits/history/route.ts` | Historique transactions |
| `POST /api/client/credits/purchase` | `app/api/client/credits/purchase/route.ts` | Initier achat |
| `POST /api/webhooks/credits` | `app/api/webhooks/credits/route.ts` | Webhook crédits |
| `POST /api/webhooks/fapshi` | `app/api/webhooks/fapshi/route.ts` | Webhook Fapshi |

---

## 7. Ce Qui Doit Changer / Problèmes Identifiés

### 🔴 Critique
1. **Fapshi est le seul provider de paiement** — Pas de Stripe, Polar, Crypto intégré
   même s'ils sont dans l'enum. Aucun fallback si Fapshi est down.
2. **Pas de stockage de wallet view/procedure** — Vérifier que `user_wallet_summary` 
   et `get_consumable_lots()` existent dans les migrations SQL
3. **Prix d'activation en dur** — `× 2.5 × 650` dans `PricingResolverService`

### 🟡 Important
4. **Bonus credits expiry** — 90 jours codé en dur (`new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)`)
   dans `credit-ledger.service.ts` ligne 240
5. **Pas de calcul du bonus** — `bonusPct` est lu du package mais pas clair comment
   le bonus est appliqué (step-package.tsx calcule `bonus = floor(credits * bonusPct / 100)`)
6. **allowedPaymentMethods jamais utilisé** — Le champ existe mais n'est pas filtré
7. **Conversion FCFA ambiguë** — `priceXaf` est en FCFA mais le nom pourrait prêter 
   à confusion

### 🟢 Observations
8. **Idempotency bien gérée** — Clés uniques sur `creditHold.idempotencyKey` et 
   `creditPurchase.idempotencyKey`
9. **Vue SQL user_wallet_summary** — Bonne pratique pour les performances
10. **Transactions DB** — Toutes les opérations critiques sont en transaction

---

## 8. Fichiers Concernés — Liste Complète

### Schémas
```
src/database/schemas/credits.ts
src/database/schemas/payments.ts
src/database/schemas/enums.ts
```

### Services
```
src/services/credit-ledger.service.ts
src/services/payment-purchase.service.ts
src/services/pricing-resolver.service.ts
src/services/activation.service.ts
src/services/fapshi/client.ts
src/services/fapshi/types.ts
src/services/fapshi/index.ts
```

### Composants
```
src/component/recharge/payment-methods.ts
src/component/recharge/payment-method-card.tsx
src/component/recharge/payment-method-check.tsx
src/component/recharge/payment-method-icon.tsx
src/component/recharge/purchase-flow.tsx
src/component/recharge/step-package.tsx
src/component/recharge/step-method.tsx
src/component/recharge/step-summary.tsx
src/component/recharge/step-stepper.tsx
src/component/recharge/recharge-drawer.tsx
src/component/recharge/recharge-drawer-provider.tsx
src/component/recharge/recharge-trigger-button.tsx
src/component/recharge/use-recharge-drawer.tsx
src/component/wallet/payment-confirm-dialog.tsx
src/component/wallet/payment-feedback-message.tsx
src/component/wallet/pending-payment-banner.tsx
src/component/wallet/transaction-row.tsx
src/component/wallet/wallet-balance-breakdown.tsx
src/component/wallet/wallet-balance-card.tsx
src/component/wallet/wallet-balance-total.tsx
src/component/wallet/wallet-cta-footer.tsx
src/component/wallet/wallet-page-shell.tsx
src/component/wallet/wallet-payment-methods.tsx
src/component/wallet/wallet-transaction-empty.tsx
src/component/wallet/wallet-transaction-item.tsx
src/component/wallet/wallet-transaction-list.tsx
src/component/wallet/wallet-transaction-tabs.tsx
```

### Pages
```
app/[locale]/(main)/wallet/page.tsx
app/[locale]/(main)/wallet/loading.tsx
app/[locale]/(main)/wallet/error.tsx
```

### Routes API
```
app/api/client/credits/packages/route.ts
app/api/client/credits/balance/route.ts
app/api/client/credits/history/route.ts
app/api/client/credits/purchase/route.ts
app/api/webhooks/credits/route.ts
app/api/webhooks/fapshi/route.ts
```

### Actions
```
src/actions/payment.action.ts
```

### Configuration
```
src/config/env.ts  (FAPSHI_API_KEY, FAPSHI_API_USER, FAPSHI_ENVIRONMENT)
```
