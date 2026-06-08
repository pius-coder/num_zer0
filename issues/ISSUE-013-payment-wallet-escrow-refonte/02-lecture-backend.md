# Phase 2 — Lecture ciblée Backend

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** reader (backend)

---

## 1. `convex/schema.ts` (L1-L135) — Définition des tables

### Tables et indexes

| Table | Champs clés | Indexes | Notes |
|-------|-------------|---------|-------|
| `users` | betterAuthUserId, email, name, isAnonymous, hasMadeDeposit, accessExpiresAt, convertedAt, country, isAdmin, **balanceUsd**, createdAt, updatedAt | by_betterAuthUserId, by_email | `balanceUsd` = colonne legacy, non utilisée par le système comptable |
| `analytics_events` | eventType, sessionId, country, device, durationMs, timestamp | by_eventType, by_sessionId | Hors périmètre paiement |
| `packages` | slug, name, priceXaf, description, isActive | by_slug | Packages de recharge legacy, prix en XAF |
| `purchases` | userId, packageId, priceXaf, promoCode, promoDiscount, paymentMethod, **status**, paymentGatewayId, checkoutUrl, **idempotencyKey**, failureReason, failedAt, createdAt | by_userId, by_idempotencyKey, by_paymentGatewayId | Statuts = strings libres (`payment_pending`, `confirmed`, `failed`, etc.) |
| `promoCodes` | code, discountPercent, discountFlat, isActive, maxUses, usedCount, expiresAt, createdAt | by_code | |
| `comptes` | code, libelle, **solde** | by_code | Comptabilité artisanale servant de wallet. `411-{userId}` = compte client, `471-escrow` = séquestre, `701-recharge` = produit, `702-sms-marge` = marge, `471-fournisseur` = dette fournisseur |
| `pieces` | date, libelle, **statut**, reference | by_reference | Statuts = strings libres (`validee`, `en_attente`, `annulee`) |
| `lignes` | pieceId, compteCode, **sens**, montant, **soldeApres** | by_piece, by_compte | Écritures comptables unitaires. `sens` = `debit` ou `credit` |
| `marginOverrides` | countryIso, serviceId, marginXaf, updatedBy, createdAt, updatedAt | by_country_service, by_service | Override de marge par pays/service |
| `activations` | userId, service, country, providerId, phoneNumber, **status** (union 8 literals), maxPrice, operator, smsCode, canGetAnotherSms, rentEndTime, providerCost, priceCharged, rentTimeHours, rentProviderId, rentEndDate, errorMessage, createdAt, updatedAt | by_userId, by_providerId, by_status, by_userId_status | Statuts typés: `awaiting_number|awaiting_sms|sms_received|completed|cancelled|expired|no_numbers|max_price_too_low` |

### Source de vérité du solde

- **Deux sources concurrentes**: `users.balanceUsd` (colonne) vs `comptes(411-{userId}).solde` (comptabilité)
- `getUserBalance()` dans `users.ts` renvoie `compte?.solde ?? 0`, ignorant `users.balanceUsd`
- `users.balanceUsd` n'est plus mis à jour — seulement initialisé à `0` dans `syncUser` (auth.ts, L48)
- La comptabilité est la source de vérité du solde affiché

### Éléments legacy identifiés

| Colonne/Table | Raison |
|---|---|
| `users.balanceUsd` | Non mise à jour, dupliquée par `comptes(411-{userId}).solde` |
| `users.isAnonymous` / `accessExpiresAt` | Logique d'accès temporaire non liée au paiement |
| `users.hasMadeDeposit` | Booléen non normalisé, doublon d'absence de `payment_intents` |
| `users.convertedAt` | Conversion anonyme → permanent, hors périmètre financier |
| `packages` table | Recharge legacy en XAF, taux 600 XAF/USD hardcodé |
| `purchases.packageId` | Toujours `'recharge'` en dur — pas de vrai package |
| `purchases.paymentMethod` | String libre, validé nullement |
| `purchases.status` | String libre, pas de validation |
| `comptes`, `pieces`, `lignes` | Comptabilité artisanale = wallet + escrow implicite |
| `pieces.statut` | String libre |
| `lignes.sens` | String libre (`debit`/`credit`) |
| `analytics_events` | Hors périmètre mais dans le même fichier |

---

## 2. `convex/purchases.ts` (L1-L507) — Flux paiement Fapshi

### Fonctions publiques

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `getPurchases` | query | `{}` | `Doc<'purchases'>[]` | Historique achats de l'utilisateur courant |
| `validatePromoCode` | query | `{ code: string }` | `{ code, discountPercent?, discountFlat? } \| null` | Validation code promo |
| `handlePaymentSuccess` | mutation | `{ transId, externalId }` | void | Callback webhook ou utilisateur — écriture comptable + patch purchase |
| `handlePaymentFailure` | mutation | `{ transId, externalId, reason }` | void | Callback webhook — patch purchase en failed |
| `cancelPurchase` | mutation | `{ purchaseId }` | `{ success }` | Annulation utilisateur (protégée) |
| `initiateDirectPay` | **action** | `{ amount, phone, medium?, promoCode? }` | `{ success, transId, link, purchaseId }` | Point d'entrée paiement — Fapshi API |
| `verifyPurchase` | **action** | `{ transId }` | `{ success, purchaseId?, status? }` | Vérification post-redirect, appelle Fapshi status |
| `getAllPurchases` | query | `{}` | `Doc<'purchases'>[]` | Admin — toutes les purchases |
| `backfillComptes` | internalMutation | `{}` | `{ confirmed, piecesCreated }` | Script one-shot pour backfill comptable |

### Fonctions internes

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `internalCreatePurchase` | internalMutation | `{ userId, priceXaf, promoCode?, promoDiscount?, paymentMethod, idempotencyKey }` | `Id<'purchases'>` | Création purchase avec idempotency |
| `internalPatchPurchase` | internalMutation | `{ purchaseId, patch }` | void | Patch générique (`v.any()`) |
| `internalGetPurchaseByGatewayId` | internalQuery | `{ transId }` | `Doc<'purchases'> \| null` | Lookup par Fapshi transId |
| `internalGetPurchaseById` | internalQuery | `{ purchaseId }` | `Doc<'purchases'> \| null` | Lookup par ID |
| `internalGetPromoCode` | internalQuery | `{ code }` | `Doc<'promoCodes'> \| null` | Lookup promo |
| `internalIncrementPromo` | internalMutation | `{ promoId }` | void | Incrémente usedCount |
| `internalGetUserByBetterAuthId` | internalQuery | `{ betterAuthUserId }` | `Doc<'users'> \| null` | Lookup user |
| `internalCreateUser` | internalMutation | `{ betterAuthUserId, accessExpiresAt }` | void | Création user avec balanceUsd=0 |
| `internalUpdateUserDeposit` | internalMutation | `{ userId, creditUsd }` | void | Met à jour hasMadeDeposit + accessExpiresAt (NE met PAS à jour balanceUsd) |

### Flux de paiement complet

```
initiateDirectPay(action)
  ├─ Auth + validations (amount >= 1500)
  ├─ Promo code validation + déduction
  ├─ internalCreatePurchase → status='payment_pending', idempotencyKey
  ├─ fapshiPost('/initiate-pay', { amount, userId, externalId, redirectUrl })
  ├─ internalPatchPurchase → set paymentGatewayId
  └─ Return { transId, link } vers frontend

→ user redirigé vers Fapshi
→ user revient sur /payment/result

verifyPurchase(action)
  ├─ internalGetPurchaseByGatewayId
  ├─ fapshiGet('/payment-status/{transId}')
  ├─ Si SUCCESSFUL:
  │   ├─ internalPatchPurchase → status='confirmed'
  │   ├─ ensureCompte(411-{userId}) + ensureCompte(701-recharge)
  │   ├─ createPiece → écriture comptable (priceXaf/600 → USD)
  │   └─ internalUpdateUserDeposit → hasMadeDeposit + accessExpiresAt
  └─ Sinon: → status='failed' si FAILED

OU webhook (concurrent):

/fapshi-webhook (POST)
  ├─ Vérifie x-wh-secret
  ├─ Si SUCCESSFUL: handlePaymentSuccess (mutation)
  │   ├─ lookup purchase by transId
  │   ├─ skip si déjà 'confirmed'
  │   ├─ ensureCompte(411-user) + ensureCompte(701-recharge)
  │   └─ createPiece (même écriture comptable que verifyPurchase)
  └─ Si FAILED: handlePaymentFailure (mutation)
```

### Risques de race condition

1. **Double confirmation**: `handlePaymentSuccess` et `verifyPurchase` peuvent s'exécuter concurremment (webhook + retour utilisateur). Chacune a un guard `if (purchase.status === 'confirmed') return`, mais l'écriture comptable peut être dupliquée si les deux passent le guard avant le patch.
2. **IdempotencyKey**: Présente dans le schéma (`by_idempotencyKey`), créée dans `initiateDirectPay` (`direct_{userId}_{Date.now()}`), mais JAMAIS vérifiée dans `handlePaymentSuccess` ou `verifyPurchase`. L'index existe mais n'est pas utilisé.
3. **Taux XAF/USD**: `600` hardcodé dans `purchases.ts:89`, `purchases.ts:428`, `purchases.ts:439`, `users.ts:4`. Changé en `XAF_TO_USD` dans `users.ts` mais `purchases.ts` n'utilise pas cette constante.
4. **arrondis**: `Math.round((purchase.priceXaf / 600) * 100) / 100` — perte de précision sur les montants.

---

## 3. `convex/comptabilite.ts` (L1-L251) — Comptabilité artisanale (wallet + escrow)

### Fonctions

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `ensureCompte` | internalMutation | `{ code, libelle }` | `Id<'comptes'>` | Crée un compte comptable si absent |
| `getCompte` | query | `{ code }` | `Doc<'comptes'> \| null` | Lecture publique d'un compte |
| `internalGetCompte` | internalQuery | `{ code }` | `Doc<'comptes'> \| null` | Lecture interne |
| `creditCompte` | internalMutation | `{ compteCode, montant }` | `nouveauSolde` | Ajoute au solde |
| `debitCompte` | internalMutation | `{ compteCode, montant }` | `nouveauSolde` | Soustrait du solde |
| `createPiece` | internalMutation | `{ libelle, statut, reference?, lignes[] }` | `Id<'pieces'>` | Crée une pièce comptable + ses lignes, modifie les soldes |
| `annulerPiece` | internalMutation | `{ pieceId }` | void | Inverse les lignes, marque statut='annulee' |
| `getMouvements` | query | `{ compteCode }` | `Mouvement[]` | Mouvements d'un compte (N+1 queries) |
| `soldeClient` | query | `{ userId }` | `number` | Solde du compte client 411-{userId} |
| `getAllComptes` | query | `{}` | `Doc<'comptes'>[]` | Admin — tous les comptes |
| `getAllPieces` | query | `{}` | `Doc<'pieces'>[]` | Admin — toutes les pièces |
| `getMyMouvements` | query | `{}` | `Mouvement[]` | Mouvements du compte courant |

### Architecture comptable

- **Wallet utilisateur** = `compte 411-{userId}` avec solde en USD
- **Escrow** = `compte 471-escrow` (montants bloqués pendant activation SMS)
- **Produit recharges** = `compte 701-recharge`
- **Marge SMS** = `compte 702-sms-marge`
- **Dette fournisseur** = `compte 471-fournisseur`
- **Écriture créée** via `createPiece` qui: insère piece → pour chaque ligne: creditCompte ou debitCompte → insert ligne

### Problèmes

- `getMouvements` fait N+1 queries (une par ligne pour récupérer la pièce associée)
- `getMyMouvements` même pattern
- Pas d'index sur `lignes.pieceId` pour filter — déjà indexé
- `createPiece` n'est pas idempotent: si appelé deux fois avec la même `reference`, double écriture

---

## 4. `convex/http.ts` (L1-L51) — Webhooks HTTP

| Path | Method | Handler | Rôle |
|------|--------|---------|------|
| `/fapshi-webhook` | POST | httpAction | Webhook Fapshi — confirme ou échoue un paiement |
| Routes BetterAuth | - | auto | Routes auth component |

### Flux webhook

```
POST /fapshi-webhook
  Header: x-wh-secret == FAPSHI_WEBHOOK_SECRET
  Body: { event, transId, externalId, status }

  Si event='successful' || status='SUCCESSFUL':
    → api.purchases.handlePaymentSuccess

  Si event='failed' || event='expired' || status='FAILED' || status='EXPIRED':
    → api.purchases.handlePaymentFailure
```

### Risques

- **Aucune idempotency check**: le webhook peut être appelé plusieurs fois par Fapshi (retry). `handlePaymentSuccess` a un guard `status === 'confirmed'` mais pas atomique.
- **Aucune vérification `externalId`**: reçu mais pas utilisé.
- **Secret en header**: vérifié par string equality seulement, pas de signature HMAC.

---

## 5. `convex/users.ts` (L1-L279) — Gestion utilisateurs

### Fonctions publiques

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `getUserBalance` | query | `{}` | `{ balanceUsd, userId }` | Solde = `compte(411-user).solde` (pas `users.balanceUsd`) |
| `getAccessStatus` | query | `{}` | `{ isExpired, remainingMs, user }` | Statut d'accès temporaire |
| `syncUser` | internalMutation | `{ betterAuthUserId, email?, name?, isAnonymous, accessExpiresAt?, hasMadeDeposit?, country? }` | `Id<'users'>` | Sync depuis BetterAuth |
| `completeDeposit` | mutation | `{}` | `{ success }` | Marque hasMadeDeposit + prolonge accès 48h |
| `convertToPermanent` | mutation | `{ email, name }` | `{ success, userId }` | Conversion anonyme → permanent |
| `hasAccess` | query | `{}` | `boolean` | Vérifie si l'utilisateur a accès |
| `checkUserExists` | query | `{ identifier }` | `{ exists }` | Check existence par email ou nom |
| `getAllUsers` | query | `{}` | `Doc<'users'>[]` | Admin — tous les utilisateurs |
| `updateUserCountry` | mutation | `{ country }` | `{ success }` | Met à jour le pays |
| `deleteUser` | mutation | `{ userId }` | `{ success }` | Admin — supprime un utilisateur |

### Source de vérité du solde

- `getUserBalance` (L10-L28): retourne `compte?.solde ?? 0`, **jamais** `users.balanceUsd`
- `users.balanceUsd` est initialisé à `0` dans `syncUser` et `auth.ts:createAuth` mais jamais modifié après
- La colonne `users.balanceUsd` est une **colonie morte** — le vrai solde est dans `comptes`

---

## 6. `convex/auth.ts` (L1-L105) — Authentification BetterAuth

### Fonctions

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `createAuth` | (ctx) => BetterAuth | void | BetterAuth instance | Configure BetterAuth avec Convex adapter + anonymous + email/password |
| `getCurrentUser` | query | `{}` | AuthUser | Retourne l'utilisateur auth courant |

### Flux sync utilisateur

```
databaseHooks.user.create.after / update.after
  → syncUserDb(user)
    Si ctx.db (contexte mutation):
      → query users by betterAuthUserId
      → patch ou insert (balanceUsd: 0)
    Sinon si ctx.runMutation:
      → internal.users.syncUser
```

### Éléments notables

- `balanceUsd: 0` défini à la création (L48), jamais mis à jour
- Admin déduit de `email.endsWith('@numzero.com')`
- Appels anonymes avec `emailDomainName: 'numzer0.app'`
- Auth routes enregistrées via `authComponent.registerRoutesLazy(http, createAuth, { cors: true })`

---

## 7. `convex/sms_provider.ts` (L1-L1231) — Activations SMS + Escrow

### Fonctions publiques

| Fonction | Type | Args | Rôle |
|----------|------|------|------|
| `initiateActivation` | mutation | `{ service, country, maxPrice?, operator? }` | Crée activation + escrow + schedule poll |
| `initiateRentalActivation` | mutation | `{ service, country, rentTimeHours, maxPrice?, operator? }` | Crée location + escrow + schedule poll rental |
| `completeActivation` | mutation | `{ activationId }` | Valide et schedule complete action (one-time) |
| `cancelActivation` | mutation | `{ activationId }` | Annule, refund escrow, schedule cancel API |
| `requestAnotherSms` | mutation | `{ activationId }` | Reset sms, schedule resend |
| `getActivation` | query | `{ activationId }` | Lecture activation (protégée) |
| `getMyActivations` | query | `{}` | Liste activations user courant |
| `getAllActivations` | query | `{}` | Admin — toutes les activations |
| `getNumberQuantity` | action | `{ country }` | Provider: quantité de numéros dispo |
| `getTopCountries` | action | `{ service }` | Provider: top pays pour un service |
| `syncPrices` | action | `{ country, service? }` | Admin — sync prix provider |
| `getOperators` | action | `{ country }` | Provider: opérateurs dispo |
| `getRentPriceList` | action | `{ country, service }` | Provider: prix location toutes durées |
| `getPrices` | action | `{ country, service? }` | Provider: prix one-time |
| `getFreePrices` | action | `{ country, service }` | Provider: free price map |

### Fonctions internes

| Fonction | Type | Args | Rôle |
|----------|------|------|------|
| `internalUpdateActivation` | internalMutation | `{ activationId, patch }` | Patch activation |
| `internalGetActivation` | internalQuery | `{ activationId }` | Lookup activation |
| `refundEscrow` | internalMutation | `{ activationId }` | Crée pièce inverse pour rembourser l'escrow |
| `completeActivationAccounting` | internalMutation | `{ activationId, priceCharged, providerCost, marginUsd }` | Écriture de capture escrow |
| `pollActivation` | internalAction | `{ activationId }` | Polling one-time: getNumber → awaiting_sms → getStatus |
| `pollRentalActivation` | internalAction | `{ activationId }` | Polling location: getRentNumber → getRentStatus |
| `completeActivationAction` | internalAction | `{ activationId }` | API call setStatus(6) puis accounting |
| `completeRentalAction` | internalAction | `{ activationId }` | API call setRentStatus(1) puis accounting |
| `cancelActivationAction` | internalAction | `{ activationId }` | API call cancel puis refund |
| `resendSmsAction` | internalAction | `{ activationId }` | API call setStatus(3) puis repoll |

### Flux escrow complet

```
initiateActivation
  ├─ Vérifie solde (compte 411-{userId}) >= maxPrice
  ├─ ensureCompte: 471-escrow, 702-sms-marge, 471-fournisseur
  ├─ createPiece (statut='en_attente', reference=activationId)
  │   ├─ creditCompte(411-user, priceUsd)  → retire du wallet
  │   └─ debitCompte(471-escrow, priceUsd) → bloque en escrow
  └─ schedule pollActivation

pollActivation → success:
  ├─ internalUpdateActivation(sms_received)
  └─ (pas de changement comptable — encore en escrow)

completeActivationAction:
  ├─ API setStatus(6) → provider marque complete
  ├─ internalUpdateActivation(completed)
  └─ completeActivationAccounting
      ├─ createPiece (statut='validee')
      │   ├─ creditCompte(471-escrow, priceCharged)         → libère escrow
      │   ├─ debitCompte(702-sms-marge, marginUsd)           → marge = priceCharged - providerCost
      │   └─ debitCompte(471-fournisseur, providerCost)      → dette fournisseur
      └─ (l'utilisateur ne récupère rien — tout est consommé)

pollActivation → failure (no_numbers, expired, etc):
  └─ refundEscrow
      └─ createPiece (statut='validee', même reference)
          ├─ creditCompte(471-escrow, priceCharged)    → débite escrow
          └─ debitCompte(411-user, priceCharged)       → rembourse utilisateur

cancelActivation:
  ├─ status=cancelled
  ├─ refundEscrow (idem)
  └─ schedule cancelActivationAction (API cancel)
```

### Risques escrow

1. **Double refund**: `refundEscrow` cherche la dernière piece par `reference` avec statut `en_attente`. Si `completeActivationAccounting` a déjà créé une pièce `validee` avec la même référence, `refundEscrow` ne la trouvera PAS (statut diffère) et ne fera rien. Mais si `refundEscrow` est appelée avant, puis `completeActivationAccounting` après, l'utilisateur est remboursé ET le système comptable fait la capture — **l'utilisateur est crédité deux fois** (une fois par refund, une fois parce que l'argent n'est plus en escrow).
2. **`completeActivationAccounting`** ne vérifie qu'une pièce `en_attente` existe avant d'écrire. Si elle est appelée après un refund déjà fait, elle créera quand même la pièce de capture.
3. **Pas d'idempotence**: `completeActivationAccounting` et `refundEscrow` n'ont pas d'idempotencyKey.
4. **Polling indéfini**: en cas d'erreur API, `pollActivation` se reschedule indéfiniment (jusqu'au timeout).

---

## 8. `convex/packages.ts` (L1-L69) — CRUD Packages

| Fonction | Type | Args | Rôle |
|----------|------|------|------|
| `list` | query | `{}` | Admin — liste packages |
| `create` | mutation | `{ slug, name, priceXaf, description?, isActive }` | Admin — créer package |
| `update` | mutation | `{ packageId, slug?, name?, priceXaf?, description?, isActive? }` | Admin — update package |
| `delete_` | mutation | `{ packageId }` | Admin — delete package |

Pas de logique métier — CRUD pur. Legacy car `purchases.packageId` = `'recharge'` en dur.

---

## 9. `convex/promo_codes.ts` (L1-L76) — CRUD Promo Codes

| Fonction | Type | Args | Rôle |
|----------|------|------|------|
| `list` | query | `{}` | Admin — liste codes promo |
| `create` | mutation | `{ code, discountPercent?, discountFlat?, isActive, maxUses?, expiresAt? }` | Admin — créer code promo |
| `update` | mutation | `{ promoId, code?, discountPercent?, discountFlat?, isActive?, maxUses?, expiresAt? }` | Admin — update code promo |
| `delete_` | mutation | `{ promoId }` | Admin — delete code promo |

---

## 10. `convex/margins.ts` (L1-L64) — CRUD Margin Overrides

| Fonction | Type | Args | Rôle |
|----------|------|------|------|
| `list` | query | `{}` | Admin — liste marginOverrides |
| `create` | mutation | `{ countryIso, serviceId, marginXaf }` | Admin — créer override |
| `update` | mutation | `{ marginId, countryIso?, serviceId?, marginXaf? }` | Admin — update override |
| `delete_` | mutation | `{ marginId }` | Admin — delete override |

---

## 11. `convex/margin_tiers.ts` (L1-L48) — Calcul marge par défaut

| Fonction | Type | Args | Returns | Rôle |
|----------|------|------|---------|------|
| `computeDefaultMargin` | export function | `costUsd: number` | `number` (XAF) | Marge par défaut basée sur seuils |
| `getEffectiveMargin` | query | `{ countryIso, serviceId, costUsd }` | `{ marginXaf, source }` | Override → wildcard → default |

### Default tiers

| Max coût (USD) | Marge (XAF) |
|---------------|-------------|
| 0.50 | 1000 |
| 1.00 | 1500 |
| ∞ | 2000 |

---

## 12. `convex/lib/auth_helpers.ts` (L1-L17)

| Fonction | Type | Rôle |
|----------|------|------|
| `requireAuth` | async (ctx) | Vérifie auth, retourne identity |
| `requireAdmin` | async (ctx) | Vérifie auth + isAdmin, retourne `{ identity, user }` |

---

## Synthèse des risques transverses

### Race conditions / Concurrence

1. **Double confirmation webhook + user**: `handlePaymentSuccess` + `verifyPurchase` peuvent courir en parallèle. Guard `status === 'confirmed'` pas atomique.
2. **Double écriture comptable**: `createPiece` sans idempotence — appelé depuis `handlePaymentSuccess` et `verifyPurchase` sans vérification préalable.
3. **Double refund escrow**: `refundEscrow` peut être appelé avant `completeActivationAccounting`, ou vice-versa.

### Problèmes d'idempotence

1. **`idempotencyKey` dans `purchases`** : présent dans le schéma, créé dans `initiateDirectPay`, mais **jamais utilisé** dans les handlers.
2. **Aucun système d'idempotence** dans `comptabilite.ts`: `createPiece`, `creditCompte`, `debitCompte` ne vérifient pas de clé.
3. **`completeActivationAccounting`** et `refundEscrow` ne vérifient pas si une pièce existe déjà pour la même activation.

### Types et statuts

| Champ | Problème |
|-------|----------|
| `purchases.status` | String libre — pas de validation |
| `pieces.statut` | String libre — `validee`, `en_attente`, `annulee` |
| `lignes.sens` | String libre — `debit`, `credit` |
| `activations.status` | Union typée (bon pattern) — 8 literals |
| Montants | `number` flottants partout, arrondis manuels |

### Éléments legacy à supprimer (no backward compat)

1. **`users.balanceUsd`** — colonne morte, vraie source = `comptes(411-user).solde`
2. **Table `packages`** — plus utilisée (`packageId` = `'recharge'` en dur)
3. **Table `purchases`** — à remplacer par `payment_intents`
4. **Tables `comptes`, `pieces`, `lignes`** — comptabilité artisanale à remplacer par `wallets` + `wallet_ledger_entries` + `escrows`
5. **Taux XAF/USD hardcodé** (`600` dans purchases.ts, users.ts) — à remplacer par taux configurable
6. **`users.hasMadeDeposit`** — booléen non normalisé
7. **`users.isAnonymous` / `accessExpiresAt` / `convertedAt`** — logique d'accès non liée au paiement
8. **`internalCreateUser` et `internalUpdateUserDeposit`** — ne mettent pas à jour le solde correctement
9. **`analytics_events` table** — hors périmètre, à déplacer si nécessaire

### Patterns à reproduire

- `activations.status` avec union typée (bon pattern de validation)
- `activations` avec index composé `by_userId_status`
- Pattern `mutation → scheduler → action` pour les opérations qui mixent API externe + Convex
