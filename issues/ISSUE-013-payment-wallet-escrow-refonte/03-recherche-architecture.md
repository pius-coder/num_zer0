# Phase 3 — Recherche Architecture

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** subagent recherche

---

## 1. Sources consultées

### 1.1 Documentation officielle Fapshi

| Source | URL | Contenu |
|--------|-----|---------|
| API Reference | https://docs.fapshi.com/en/api-reference | Index complet des endpoints |
| Initiate Pay | https://docs.fapshi.com/en/api-reference/endpoint/initiate-pay.md | Création de lien de paiement hébergé |
| Direct Pay | https://docs.fapshi.com/en/api-reference/endpoint/direct-pay.md | Paiement direct sur mobile |
| Payment Status | https://docs.fapshi.com/en/api-reference/endpoint/payment-status.md | Statuts: CREATED, PENDING, SUCCESSFUL, FAILED, EXPIRED |
| Webhook | https://docs.fapshi.com/en/api-reference/endpoint/webhook.md | Notifications temps réel SUCCESSFUL/FAILED/EXPIRED |
| Expire Pay | https://docs.fapshi.com/en/api-reference/endpoint/expire-pay.md | Expiration manuelle d'un lien de paiement |
| LLMs.txt index | https://docs.fapshi.com/llms.txt | Index machine-readable complet |

### 1.2 Documentation officielle SMS Online Pro

| Source | URL | Contenu |
|--------|-----|---------|
| API Index | https://sms-online.pro/docs/api/en/ | Index de toutes les méthodes |
| Get Number | https://sms-online.pro/docs/api/en/number.html | Création d'activation avec paramètres |
| Set Status | https://sms-online.pro/docs/api/en/change_status.html | Statuts: 1 (SMS reçu), 3 (renvoyer), 6 (compléter), 8 (annuler) |
| Get Status | https://sms-online.pro/docs/api/en/get_status.html | Réponses: STATUS_WAIT_CODE, STATUS_CANCEL, STATUS_OK, STATUS_WAIT_RETRY |
| Get Balance | https://sms-online.pro/docs/api/en/balance.html | Solde du compte provider |
| Get Prices | https://sms-online.pro/docs/api/en/get_prices.html | Prix par combinaison (pays, service) |

### 1.3 Patterns généraux (web research)

- Stripe Idempotency Pattern (ref: https://docs.stripe.com/api/idempotent_requests)
- Modern Treasury — State machine + idempotency (ref: https://www.moderntreasury.com/journal/why-idempotency-matters-in-payments)
- Convex mutations — atomicité et isolation par mutation (ref: https://get-convex-convex-backend.mintlify.app/api/server/mutations)
- Double-entry ledger schema pattern (ref: https://naya.finance/learn/double-entry-database-schema-sql-design)
- Idempotent consumer pattern (ref: https://java-design-patterns.com/patterns/microservices-idempotent-consumer)
- Stripe-style idempotency key with request fingerprinting (ref: https://codelit.io/blog/api-idempotency-patterns)
- Two-phase idempotency: reservation (IN_PROGRESS) then completion (COMPLETED) (ref: https://aloknecessary.github.io/blogs/idempotency-distributed-systems)

### 1.4 Code existant (codebase analysis)

| Fichier | Rôle |
|---------|------|
| `convex/purchases.ts` | Flux Fapshi (initiateDirectPay, verifyPurchase, handlePaymentSuccess) |
| `convex/comptabilite.ts` | Comptabilité artisanale (wallet + escrow via comptes/pieces/lignes) |
| `convex/http.ts` | Webhook Fapshi (POST /fapshi-webhook) |
| `convex/sms_provider.ts` | Escrow activation SMS (refundEscrow, completeActivationAccounting) |
| `convex/schema.ts` | Tables legacy (users.balanceUsd, purchases, comptes, pieces, lignes) |
| `convex/users.ts` | Source de vérité du solde (getUserBalance → comptes.solde) |
| `scripts/test-fapshi.mjs` | Test script Fapshi sandbox |

---

## 2. Contraintes providers — Confirmations et implications

### 2.1 Fapshi

| Contrainte | Source | Implication pour l'architecture cible |
|------------|--------|--------------------------------------|
| Authentification par headers `apiuser` + `apikey` | Docs | Couplé au service Fapshi — à encapsuler dans un `PaymentProvider` abstrait |
| 6 requêtes/min max par `transId` sur `/payment-status` | Docs Payment Status | Interdire le polling côté client comme seul mécanisme ; webhook obligatoire comme source de vérité |
| Lien de paiement expire après 24h (initiate-pay) | Docs Initiate Pay | `payment_intents` doit modéliser une expiration (champ `expiresAt`) |
| Direct Pay ne peut PAS expirer (final SUCCESSFUL ou FAILED) | Docs Direct Pay | Attention : les deux types de paiement ont des cycles de vie différents |
| Webhook unique par événement (pas de retry automatique documenté) | Docs Webhook | En pratique, les webhooks peuvent être retry par l'infrastructure ; l'idempotence côté récepteur est impérative |
| Secret webhook partagé (`x-wh-secret`) — pas de signature HMAC | Docs Webhook | Sécurité limitée ; le secret ne peut pas être relu depuis le dashboard |
| IP whitelisting pour initiate-pay, direct-pay, payout | Docs Request Status | Les appels API Fapshi doivent venir d'IPs whitelistées ; implique que les Convex actions qui appellent Fapshi doivent avoir une IP stable (Convex Actions = IP du backend Convex) — vérifier la compatibilité |
| `externalId` champ de réconciliation (1-100 chars, `[a-zA-Z0-9\-_]`) | Docs Initiate Pay | Peut contenir l'`idempotencyKey` Convex pour faire le lien — exactement ce que fait le code actuel |
| `userId` champ optionnel (1-100 chars) | Docs Initiate Pay | Peut être utilisé pour passer le `betterAuthUserId` |
| Montants en XAF (entier minimum 100) | Docs Initiate Pay | Toutes les conversions XAF↔USD doivent être gérées dans notre couche, pas par Fapshi |
| `transId` = identifiant Fapshi unique pour chaque transaction | Docs Payment Status | C'est le futur `providerOperation.externalId` / `payment_intent.providerTransactionId` |

### 2.2 SMS Online Pro

| Contrainte | Source | Implication |
|------------|--------|-------------|
| API key unique en paramètre (`api_key`) | Docs API Index | Provider centralisé via un compte unique ; toutes les opérations provider passent par cette clé |
| `getPrices` retourne structure `{"Country":{"Service":{"cost":Cost,"count":Count}}}` | Docs Get Prices | Prix dépend de (pays, service) — pas de prix par pays seul. Confirme le constat ISSUE-009. |
| `getNumber` retourne `ACCESS_NUMBER:{id}:{phone}` | Docs Get Number | L'`id` provider = clé de l'activation chez SMS Online Pro |
| `setStatus(6)` = compléter l'activation | Docs Set Status | L'appel API de complétion est destructif ; doit être protégé par idempotence |
| `setStatus(8)` = annuler | Docs Set Status | Annulation possible sauf dans les 2 premières minutes (EARLY_CANCEL_DENIED) |
| `getStatus` retourne `STATUS_OK:{code}` ou `STATUS_WAIT_CODE` | Docs Get Status | Le SMS code n'est disponible qu'une fois ; le polling doit s'arrêter immédiatement après réception |
| Balance accessible via `getBalance` | Docs Get Balance | Le solde du compte provider peut être monitoré côté admin |
| Rent API séparée (getRentNumber, getRentStatus, etc.) | Docs Rent API | Les activations location ont un cycle de vie différent (date de fin, prolongation) — important pour la modélisation de l'escrow location |

---

## 3. Principes confirmés par la recherche

### 3.1 Pattern Payment Intents (Stripe-like)

La recherche confirme que le **modèle Payment Intent** est le standard industriel pour découpler le paiement du provider :

```
PaymentIntent:
  id: string              // Convex ID
  userId: string          // betterAuthUserId
  amount: number          // montant en USD (cents) — notre unité interne
  currency: string        // 'USD' (interne), conversion XAF en entrée
  provider: string        // 'fapshi' | ...
  providerTransactionId: string | null  // transId Fapshi
  providerData: any       // payload brut Fapshi (statuts, lien, etc.)
  idempotencyKey: string  // unique, avec contrainte unique Convex
  status: PaymentIntentStatus  // union typée (voir §3.3)
  expiresAt: number       // 24h après création (Fapshi initiate-pay)
  metadata: Record<string, string>  // flexible
  createdAt: number
  updatedAt: number
```

**Sources:**
- Stripe Payment Intents: `Idempotency-Key` header obligatoire pour les mutations
- Fapshi `initiate-pay` crée un `transId` + `link` — exactement un Payment Intent
- Le code legacy a déjà une `idempotencyKey` dans `purchases` mais sans contrainte unique ni vérification réelle

### 3.2 Pattern Wallet + Ledger (double-entry simplifié)

Les recherches sur le double-entry ledger pattern confirment la direction :

```
Wallet:
  userId: string          // betterAuthUserId (1:1 avec user)
  balance: number         // solde en USD (cents), mis à jour atomiquement via ledger
  createdAt: number
  updatedAt: number

WalletLedgerEntry:
  id: string
  walletId: string
  type: LedgerEntryType   // 'credit' | 'debit'
  amount: number          // en USD (cents)
  balanceBefore: number
  balanceAfter: number
  reference: string       // lien vers PaymentIntent, Escrow, etc.
  description: string
  idempotencyKey: string | null  // unique, pour garantir exactly-once
  createdAt: number
```

**Principes clés (confirmés par la recherche):**

| Principe | Source | Confirmation |
|----------|--------|-------------|
| **Ne jamais stocker le solde comme seul source** — toujours dérivable des entrées du ledger | Naya Finance, Formance, Stack Overflow | Le `comptes.solde` actuel est une source couplée ; `Wallet.balance` peut être un cache mais le ledger est la vérité |
| **Immuabilité** — jamais UPDATE ou DELETE sur une entrée de ledger | Naya Finance, Modern Treasury | Les erreurs comptables sont corrigées par des entrées de contrepassation, pas par suppression |
| **Atomicité** — chaque opération financière est atomique | Convex docs (mutation = isolation totale) | Convex fournit cette garantie nativement : toutes les écritures d'une mutation sont atomiques |
| **Reference chain** — chaque entrée de ledger pointe vers la cause (PaymentIntent, Escrow, Refund) | Modèle double-entry standard | `WalletLedgerEntry.reference` = clé de lien traçable |

### 3.3 Pattern State Machine (typé vs string libre)

La recherche confirme le besoin de **state machines formelles** pour chaque entité financière :

```ts
// Payment Intent states
type PaymentIntentStatus =
  | 'created'        // initial
  | 'pending'        // en attente du provider
  | 'confirmed'      // succès (verified par webhook ou polling)
  | 'failed'         // échec définitif
  | 'expired'        // lien expiré (24h)
  | 'cancelled'      // annulé manuellement

// Escrow states
type EscrowStatus =
  | 'active'         // fonds bloqués
  | 'captured'       // fonds libérés vers le fournisseur
  | 'refunded'       // fonds remboursés à l'utilisateur
  | 'expired'        // activation expirée

// WalletLedger entry type
type LedgerEntryType = 'debit' | 'credit'
```

**Source:** Modern Treasury utilise des state machines pour valider les transitions (un paiement "confirmed" ne peut pas revenir à "pending").

### 3.4 Pattern Idempotence — architecture à double phase

La recherche (aloknecessary, codelit.io, Stripe) confirme que la simple vérification "if exists → skip" est insuffisante à cause des races conditions. Le pattern correct :

1. **Phase réservation** : `INSERT idempotency_key WITH status='IN_PROGRESS'` (unique constraint → échoue si existe déjà)
2. **Si échoue (key existe)** : lire le résultat existant et le retourner
3. **Si réussit** : traiter l'opération, puis UPDATE status → `'COMPLETED'` avec le résultat

**Variante Convex :** Convex n'a pas de contrainte `UNIQUE` native, mais on peut :
- Utiliser un index unique sur `idempotencyKey` (l'index `by_idempotencyKey` existe déjà dans `purchases` mais sans `unique`)
- Combiner avec un check + write atomique via mutation Convex (une mutation est atomique, donc `read → write` dans la même mutation est safe)
- Stocker l'idempotency record dans une table dédiée `idempotencyKeys`

```ts
// Pattern idempotence Convex (dans une mutation):
const existing = await ctx.db
  .query('paymentIntents')
  .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.key))
  .first()
if (existing) return existing // déjà traité

// Sinon, créer et traiter (atomique car dans une mutation)
const id = await ctx.db.insert('paymentIntents', { idempotencyKey: args.key, ... })
// ... suite du traitement
return id
```

> **Important :** Convex ne supporte pas les `UNIQUE` constraints sur les indexes. L'idempotence repose donc sur l'atomicité de la mutation : entre la vérification `first()` et l'`insert()`, aucun autre appel ne peut interférer car une mutation Convex est exécutée en isolation totale.

### 3.5 Pattern Escrow (déblocage conditionnel)

La recherche confirme que l'escrow doit être modélisé comme une **entité de premier ordre**, pas comme un effet de bord comptable :

```
Escrow:
  id: string
  userId: string
  activationId: Id<'activations'>
  amount: number            // montant bloqué en USD
  status: EscrowStatus      // active → captured | refunded | expired
  capturedAt: number | null
  refundedAt: number | null
  idempotencyId: string | null   // clé unique
  createdAt: number

  // Transitions:
  // active     → captured   (completeActivationAccounting)
  // active     → refunded   (refundEscrow / cancelActivation)
  // active     → expired    (activation timeout)
```

**Transitions protégées :**
- `active → captured` : vérifier qu'une seule capture est faite (via `idempotencyId` sur l'entrée ledger de capture)
- `active → refunded` : vérifier que l'escrow n'a pas déjà été capturé (check status)
- `active → expired` : peut être déclenchée par un scheduler après X temps sans completion

**Source :** Le code actuel dans `sms_provider.ts` (refundEscrow, completeActivationAccounting) montre explicitement ce risque de double capture/refund — le pattern escrow dédié résout ce problème.

### 3.6 Provider Abstraction (adapter pattern)

La recherche confirme que le couplage direct à Fapshi (`fapshiPost`/`fapshiGet`) est un risque :

```
ProviderOperation:
  id: string
  provider: 'fapshi' | 'sms_online_pro'
  endpoint: string          // /initiate-pay, /payment-status/{transId}, etc.
  request: Record<string, any>
  response: Record<string, any> | null
  status: 'pending' | 'success' | 'failed'
  idempotencyKey: string
  createdAt: number
  completedAt: number | null
```

**Avantage :** Stocker TOUS les appels provider dans une table permet :
1. Audit complet des échanges
2. Rejeu en cas d'échec
3. Debug sans logs externes
4. Indépendance du provider (remplacer Fapshi = nouveau module, pas de refonte du core)

---

## 4. Recommandations traçables

### 4.1 Modèle de données cible

| Table | Remplace | Justification |
|-------|----------|--------------|
| `wallets` | `comptes(411-{userId}).solde` + `users.balanceUsd` | Source unique du solde, lien 1:1 avec user |
| `wallet_ledger_entries` | `lignes` + `pieces` | Entrées immuables, solde dérivable, lien traçable vers cause |
| `payment_intents` | `purchases` (flux Fapshi) | Modèle Stripe-like, découplé du provider |
| `escrows` | Comptes `471-escrow` implicites dans `pieces/lignes` | Entité dédiée avec state machine et transitions protégées |
| `provider_operations` | (nouveau) | Trace de tous les appels API externes |
| `orders` | `purchases` (historique) | Vue métier des recharges effectuées |
| `promo_codes` | `promoCodes` (inchangé) | CRUD à garder, peut référencer `payment_intents` |

### 4.2 Flux de paiement cible (Fapshi encapsulé)

```
1. Client → payment_intents.create({ amount, phone, ... })
   ├─ Génère idempotencyKey (UUID)
   ├─ Insère payment_intent (status='created')
   ├─ Appelle PaymentProvider.initiatePay()
   │   └─ Stocke dans provider_operations
   └─ Retourne { transId, link }

2. Client redirigé vers Fapshi → paiement → webhook
   └─ POST /webhook/fapshi
       ├─ Vérifie x-wh-secret
       ├─ Cherche payment_intent par externalId (idempotencyKey)
       ├─ Vérifie idempotence : si déjà 'confirmed', skip
       ├─ Patch payment_intent → 'confirmed'
       ├─ wallet_ledger_entry.insert({
       │     type: 'credit',
       │     amount: convertedUsd,
       │     reference: payment_intent._id,
       │     idempotencyKey: unique_per_credit
       │   })
       └─ Retourne 200

3. OU retour utilisateur → /payment/result → verifyPurchase
   └─ vérifie status via PaymentProvider.getStatus()
       ├─ Si SUCCESSFUL mais payment_intent déjà 'confirmed' → skip (idempotent)
       └─ Sinon → procède comme webhook (même logique protégée)
```

### 4.3 Flux escrow cible

```
1. initiateActivation({ service, country, maxPrice })
   ├─ Vérifie wallet.balance >= maxPrice
   ├─ Escrow.create({ userId, activationId, amount: maxPrice, status: 'active' })
   ├─ wallet_ledger_entry.insert({ type: 'debit', amount: maxPrice, reference: escrow._id })
   └─ schedule pollActivation

2. completeActivation → activation_success
   ├─ Vérifie escrow.status === 'active' (échec si déjà captured/refunded)
   ├─ Escrow.patch({ status: 'captured', capturedAt: Date.now() })
   ├─ wallet_ledger_entry.insert({ type: 'credit', amount: priceCharged, reference: escrow._id })
   ├─ wallet_ledger_entry.insert({ type: 'debit', amount: providerCost, reference: escrow._id, account: 'fournisseur' })
   └─ wallet_ledger_entry.insert({ type: 'credit', amount: margin, reference: escrow._id, account: 'marge' })

3. cancelActivation / failure → refund
   ├─ Vérifie escrow.status === 'active'
   ├─ Escrow.patch({ status: 'refunded', refundedAt: Date.now() })
   └─ wallet_ledger_entry.insert({ type: 'credit', amount: priceCharged, reference: escrow._id })
```

### 4.4 Règles idempotence à implémenter

| Point d'entrée | Clé d'idempotence | Protection |
|----------------|-------------------|------------|
| `payment_intents.create` | UUID généré côté client | Index `by_idempotencyKey` + check atomique dans la mutation |
| Webhook Fapshi | `externalId` (= idempotencyKey du payment_intent) | Check `payment_intent.status !== 'confirmed'` + idempotencyKey sur l'entrée ledger |
| `completeActivationAccounting` | `escrowId + '_capture'` | Une seule entrée ledger de capture par escrow |
| `refundEscrow` | `escrowId + '_refund'` | Une seule entrée ledger de refund par escrow |
| `createWalletEntry` | UUID généré côté serveur | Index unique sur `wallet_ledger_entries.idempotencyKey` |

### 4.5 Abstractions provider

```ts
// Interface commune pour les providers de paiement
interface PaymentProvider {
  initiatePay(amount: number, externalId: string, userId: string): Promise<InitiatePayResult>
  getStatus(transId: string): Promise<PaymentStatusResult>
  processWebhook(payload: unknown): WebhookEvent
  expirePayment(transId: string): Promise<void>
}

// Implémentations
class FapshiProvider implements PaymentProvider { ... }
// Future: class OtherProvider implements PaymentProvider { ... }
```

Cette abstraction permet de :
- Tester les flux sans Fapshi (mock provider)
- Changer de provider sans toucher au métier
- Ajouter un second provider (Mobile Money Sénégal, etc.)

### 4.6 Taux de conversion XAF↔USD

Remplacer le hardcodage `XAF_TO_USD = 600` par :

```ts
// Dans le schema ou une config externalisée
const EXCHANGE_RATES = defineTable({
  from: v.string(),   // 'XAF'
  to: v.string(),     // 'USD'
  rate: v.number(),   // 1/600 = 0.001666...
  updatedAt: v.number(),
})
```

Ou plus simplement, une constante dans un fichier de configuration (pas dupliquée). Le taux XAF→USD est stable (XAF = CFA, arrimé à l'EUR), mais ne devrait pas être hardcodé à 4 endroits différents.

---

## 5. Risques résiduels identifiés

1. **Convex n'a pas de contrainte UNIQUE native** : l'idempotence repose sur l'atomicité des mutations. C'est suffisant pour un déploiement mono-région (Convex), mais à documenter explicitement.
2. **Webhook Fapshi single event** : Fapshi dit "un seul webhook par événement", mais les infrastructures réseau peuvent dupliquer. L'idempotence côté récepteur reste impérative.
3. **Migration des activations en cours** : les escrows legacy dans `pieces/lignes` doivent être migrés vers `escrows` sans perte. Une mutation de backfill (inspirée de `backfillComptes`) sera nécessaire.
4. **Provider operations storage cost** : chaque appel API externe produit un document. À configurer un TTL logique (purge après 90 jours) via un scheduler Convex.
5. **XAF→USD arrondis** : les montants doivent être en `number` (pas de `BigInt` en Convex). Utiliser des cents (USD cents, XAF) pour minimiser la perte.

---

## 6. Design patterns recommandés (résumé)

| Pattern | Où | Pourquoi |
|---------|----|----------|
| **Factory/Strategy** | Providers de paiement | Découpler Fapshi du métier |
| **State Machine** | `payment_intents.status`, `escrows.status` | Transitions explicites, pas de strings libres |
| **Transactional Outbox** | `provider_operations` + mutations Convex | Atomicité entre l'opération provider et l'état local |
| **Idempotent Consumer** | Webhook + verifyPayment + refundEscrow + completeActivation | Tous les points d'entrée qui modifient l'état financier |
| **Immutable Ledger** | `wallet_ledger_entries` | Jamais de UPDATE/DELETE, corrections par contrepassation |
| **Scheduler Chain** | Polling activation, expiration escrow | Pattern déjà existant, à généraliser avec idempotence |
