# Research: Module `payment_intents.ts` — Flux Fapshi Encapsulé (Step 5)

**Date:** 2026-06-08
**Objectif:** Implémenter `convex/payment_intents.ts` — module encapsulant le flux Fapshi (initiation, vérification, confirmation) avec idempotence, logging provider_operations, et intégration wallet.

---

## 1. Sources Consultées

| Source | URL | Contenu clé |
|--------|-----|-------------|
| Fapshi Initiate Pay | https://docs.fapshi.com/en/api-reference/endpoint/initiate-pay | `POST /initiate-pay`, body: `{amount, email, redirectUrl, userId, externalId, message}`, response: `{message, link, transId, dateInitiated}` |
| Fapshi Direct Pay | https://docs.fapshi.com/en/api-reference/endpoint/direct-pay | `POST /direct-pay`, body: `{amount, phone, medium, name, email, userId, externalId, message}`, response: `{message, transId, dateInitiated}` |
| Fapshi Payment Status | https://docs.fapshi.com/en/api-reference/endpoint/payment-status | `GET /payment-status/:transId`, response: `{transId, status (CREATED|PENDING|SUCCESSFUL|FAILED|EXPIRED), amount, revenue, medium, ...}`, rate limit: 6 req/min/transId |
| Fapshi Expire Pay | https://docs.fapshi.com/en/api-reference/endpoint/expire-pay | `POST /expire-pay`, body: `{transId}`, response: transaction object ou 400 "Link already expired" |
| Fapshi Webhook | https://docs.fapshi.com/en/api-reference/endpoint/webhook | POST avec payload = réponse payment-status. Header `x-wh-secret` pour auth. Status: SUCCESSFUL, FAILED, EXPIRED |
| Convex Actions | https://docs.convex.dev/functions/actions | `action` constructor, `ctx.runQuery()`, `ctx.runMutation()`, `fetch()` dans actions, 10min timeout, pas de `ctx.db` |
| Convex Mutations | https://docs.convex.dev/functions/mutation-functions | Atomicité transactionnelle, pas de fetch dans mutations, `internalMutation` |
| Convex ActionCtx | https://docs.convex.dev/api/interfaces/server.GenericActionCtx | `runQuery`, `runMutation`, `runAction`, `auth`, `scheduler`, `storage`, `vectorSearch` |
| Codebase: `convex/purchases.ts` | `/home/ubuntu/num_zer0/convex/purchases.ts` | Helpers `fapshiPost`/`fapshiGet`, pattern action → internalMutation → fetch → internalMutation, `initiateDirectPay`, `verifyPurchase`, `handlePaymentSuccess` |
| Codebase: `convex/http.ts` | `/home/ubuntu/num_zer0/convex/http.ts` | Webhook Fapshi existant, vérification `x-wh-secret`, appelle `handlePaymentSuccess`/`handlePaymentFailure` |
| Codebase: `convex/wallet.ts` | `/home/ubuntu/num_zer0/convex/wallet.ts` | `internalCreditWallet`, `internalDebitWallet`, `ensureWalletExists`, ledger entries |
| Codebase: `convex/provider_operations.ts` | `/home/ubuntu/num_zer0/convex/provider_operations.ts` | `logOperation` internalMutation pour tracer tous les appels Fapshi |
| Codebase: `convex/schema.ts` | `/home/ubuntu/num_zer0/convex/schema.ts` | Tables `payment_intents`, `provider_operations`, `wallets`, `wallet_ledger_entries`, `orders` déjà définies |

---

## 2. Endpoints Fapshi — Détails Techniques

### 2.1 Base URL et Headers

```ts
// Sandbox
const BASE = 'https://sandbox.fapshi.com'

// Live
const BASE = 'https://live.fapshi.com'

// Headers requis pour TOUS les endpoints
Headers: {
  apiuser: '<FAPSHI_API_USER>',
  apikey: '<FAPSHI_API_KEY>',
  'Content-Type': 'application/json',  // POST only
}
```

Le choix sandbox/live est déterminé par `FAPSHI_ENV` (`'live'` ou autre).

### 2.2 POST /initiate-pay — Création de lien de paiement

**Request body:**
```json
{
  "amount": 1000,          // required, integer, min 100 XAF
  "email": "user@x.com",   // optional, préremplit l'email sur la page Fapshi
  "redirectUrl": "https://...", // optional, URL de redirection post-paiement
  "userId": "auth0|123",   // optional, 1-100 chars [a-zA-Z0-9\-_]
  "externalId": "order_456", // optional, ID de reconciliation
  "message": "Recharge"    // optional, raison du paiement
}
```

**Response 200:**
```json
{
  "message": "Payment initiated successfully",
  "link": "https://sandbox.fapshi.com/pay/xxx",
  "transId": "FAP-XXXXXXXXXX",
  "dateInitiated": "2024-01-15"
}
```

**Erreurs:** 4XX avec `{ "message": "<reason>" }`

**Note:** Le lien expire après 24h.

### 2.3 POST /direct-pay — Paiement direct mobile

**Request body:**
```json
{
  "amount": 1000,          // required, integer, min 100 XAF
  "phone": "67XXXXXXX",    // required, string
  "medium": "mobile money", // optional, "mobile money" | "orange money"
  "name": "John Doe",      // optional
  "email": "john@x.com",   // optional
  "userId": "auth0|123",   // optional
  "externalId": "order_456", // optional
  "message": "Recharge"    // optional
}
```

**Response 200:**
```json
{
  "message": "Payment request sent",
  "transId": "FAP-XXXXXXXXXX",
  "dateInitiated": "2024-01-15"
}
```

**Warning:** Désactivé par défaut en live. Transactions **n'expirent pas** (final state = SUCCESSFUL ou FAILED).

### 2.4 GET /payment-status/:transId — Vérification statut

**Response 200:**
```json
{
  "transId": "FAP-XXXXXXXXXX",
  "status": "SUCCESSFUL",        // CREATED | PENDING | SUCCESSFUL | FAILED | EXPIRED
  "medium": "mobile money",       // mobile money | orange money | fapshi
  "serviceName": "MyService",
  "transType": "Collection",      // Collection | Payout
  "amount": 1000,
  "revenue": 970,                 // Montant reçu après frais Fapshi
  "payerName": "John Doe",
  "email": "john@x.com",
  "redirectUrl": "https://...",
  "externalId": "order_456",
  "userId": "auth0|123",
  "webhook": "https://...",
  "financialTransId": "MTN-XXX", // Transaction ID opérateur
  "dateInitiated": "2024-01-15",
  "dateConfirmed": "2024-01-15"
}
```

**Rate limit:** 6 requêtes/minute par transId. Privilégier le webhook.

### 2.5 POST /expire-pay — Expiration manuelle

**Request body:**
```json
{
  "transId": "FAP-XXXXXXXXXX"
}
```

**Response 200:** Objet transaction complet (même format que payment-status).

**Erreur 400:** `{ "message": "Link already expired" }` si déjà expiré.

### 2.6 Webhook — Notification push

- **Méthode:** POST de Fapshi vers l'URL configurée dans le dashboard
- **Header sécurité:** `x-wh-secret` (valeur configurée dans le dashboard)
- **Payload:** Identique à la réponse de `GET /payment-status/:transId`
- **Déclencheurs:** statut change vers SUCCESSFUL, FAILED, ou EXPIRED
- **Garantie:** 1 requête par événement (pas de retry si pas de réponse 200)
- **Recommandation:** Répondre rapidement avec 200 OK

---

## 3. Pattern Action Convex pour Fapshi

### 3.1 Architecture générale

```
Client (useMutation)
  │
  ▼
MUTATION (write intent + idempotencyKey + capture userId)
  │
  ▼ (ctx.scheduler.runAfter(0, ...))
  │    ou
  ▼ (appel action directe depuis la mutation)
ACTION
  │
  ├─ ctx.runQuery(internal.purchases.internalGetPurchaseById)  → read DB
  ├─ fetch('https://sandbox.fapshi.com/...')                  → call Fapshi
  │   └─ try/catch autour du fetch
  └─ ctx.runMutation(internal.purchases.internalPatchPurchase) → write DB
      └─ si erreur → write status 'failed'
```

**Impossible d'utiliser `ctx.db` dans une action.** Toute interaction DB passe par `ctx.runQuery()` et `ctx.runMutation()`.

Chaque `ctx.runMutation()` est une **transaction séparée**. L'action peut chaîner plusieurs mutations, mais elles ne sont PAS atomiques entre elles.

### 3.2 Appel Fapshi (fetch dans une action)

```ts
// Helper existant dans purchases.ts (à extraire dans un fichier partagé)
const FAPSHI_API_BASE =
  process.env.FAPSHI_ENV === 'live' ? 'https://live.fapshi.com' : 'https://sandbox.fapshi.com'

async function fapshiPost(path: string, body: Record<string, unknown>) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      apiuser: apiUser,
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}

async function fapshiGet(path: string) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    headers: { apiuser: apiUser, apikey: apiKey },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}
```

Les helpers `fapshiPost` et `fapshiGet` sont déjà dans `purchases.ts`. Pour éviter la duplication, ils seront extraits dans `convex/lib/fapshi.ts`.

### 3.3 Écriture DB depuis une action via ctx.runMutation()

```ts
// Action → écrit via internalMutation
export const initiatePayment = action({
  args: { amount: v.number(), /* ... */ },
  handler: async (ctx, args) => {
    // 1. Lire/écrire en DB via internalQuery / internalMutation
    const paymentIntentId = await ctx.runMutation(
      internal.payment_intents.internalCreatePaymentIntent,
      { userId, amountCents, /* ... */ }
    )

    try {
      // 2. Appel Fapshi
      const result = await fapshiPost('/initiate-pay', { /* ... */ })

      // 3. Mettre à jour le payment intent
      await ctx.runMutation(internal.payment_intents.internalMarkProcessing, {
        paymentIntentId,
        gatewayTransactionId: result.transId,
        checkoutUrl: result.link,
      })

      return { success: true, transId: result.transId, checkoutUrl: result.link }
    } catch (err) {
      // 4. En cas d'erreur → marquer failed
      await ctx.runMutation(internal.payment_intents.internalMarkFailed, {
        paymentIntentId,
        reason: err instanceof Error ? err.message : 'Fapshi error',
      })
      throw err
    }
  },
})
```

### 3.4 Gestion d'erreur dans l'action

```ts
try {
  const result = await fapshiPost('/initiate-pay', { amount, email, userId, externalId, message, redirectUrl })
  // TODO: success
} catch (err) {
  // 1. Logger l'erreur dans provider_operations
  await ctx.runMutation(internal.provider_operations.logOperation, {
    provider: 'fapshi',
    operation: 'initiate-pay',
    request: JSON.stringify({ amount, email, userId }),
    response: err instanceof Error ? err.message : 'Unknown error',
    status: 'error',
    referenceId: idempotencyKey,
  })

  // 2. Marquer le payment intent comme failed dans la même logique
  await ctx.runMutation(internal.payment_intents.internalMarkFailed, {
    paymentIntentId,
    reason: err instanceof Error ? err.message : 'Fapshi error',
  })

  throw err  // Re-throw pour que le client sache que ça a échoué
}
```

### 3.5 Pattern idempotence

```ts
// AVANT toute opération, vérifier l'idempotencyKey
const existing = await ctx.runQuery(internal.payment_intents.internalGetByIdempotencyKey, {
  idempotencyKey,
})

if (existing) {
  // Retourner l'existant (GET, pas CREATE)
  return { success: true, paymentIntentId: existing._id, alreadyExists: true }
}

// SINON créer
const paymentIntentId = await ctx.runMutation(
  internal.payment_intents.internalCreatePaymentIntent,
  { userId, amountCents, idempotencyKey, /* ... */ }
)
```

L'idempotencyKey est générée côté mutation (avant l'action) et stockée avec un index unique `by_idempotencyKey`.

### 3.6 Logging provider_operations

Tout appel à Fapshi (réussi ou échoué) doit être loggé dans `provider_operations` :

```ts
await ctx.runMutation(internal.provider_operations.logOperation, {
  provider: 'fapshi',
  operation: 'initiate-pay',        // initiate-pay | direct-pay | payment-status | expire-pay
  request: JSON.stringify({ amount, email, userId }),
  response: JSON.stringify(result),  // Réponse Fapshi ou message d'erreur
  status: result.success ? 'success' : 'error',
  referenceId: paymentIntentId,      // Lien vers le payment intent
})
```

---

## 4. Structure Exacte du Module `convex/payment_intents.ts`

### 4.1 Vue d'ensemble

```
payment_intents.ts
├── HELPERS (importés de convex/lib/fapshi.ts)
│   ├── fapshiPost()
│   └── fapshiGet()
│
├── QUERIES (publiques)
│   ├── listPaymentIntents()       → paiements de l'utilisateur connecté
│   └── listAllPaymentIntents()    → admin: tous les paiements
│
├── ACTIONS (publiques — point d'entrée depuis le frontend)
│   ├── initiatePayment()          → 1. internalCreatePaymentIntent
│   │                               2. fetch Fapshi /initiate-pay
│   │                               3. internalMarkProcessing
│   │                               4. log provider_operation
│   │
│   └── verifyPaymentIntent()      → 1. fetch Fapshi /payment-status/:transId
│                                    2. confirmPaymentIntent via internalMutation
│                                    3. log provider_operation
│
├── INTERNAL MUTATIONS (privées — appelées par actions & webhook)
│   ├── internalCreatePaymentIntent()    → insert payment_intent (status: pending)
│   ├── internalMarkProcessing()         → patch status: processing + gatewayTransactionId
│   ├── internalMarkFailed()             → patch status: failed + failureReason
│   ├── internalMarkExpired()            → patch status: expired
│   ├── internalConfirmPaymentIntent()   → idempotent: verify status, credit wallet, create order
│   └── internalCancelPaymentIntent()    → patch status: cancelled (user-initiated)
│
└── INTERNAL QUERIES (privées)
    ├── internalGetPaymentIntentById()
    ├── internalGetPaymentIntentByIdempotencyKey()
    └── internalGetPaymentIntentByGatewayId()
```

### 4.2 Détail des fonctions

#### HELPERS — `convex/lib/fapshi.ts`

```ts
// Extrait des helpers de purchases.ts dans un fichier partagé
// Réutilisé par payment_intents.ts

const FAPSHI_API_BASE =
  process.env.FAPSHI_ENV === 'live' ? 'https://live.fapshi.com' : 'https://sandbox.fapshi.com'

export async function fapshiPost(path: string, body: Record<string, unknown>) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    method: 'POST',
    headers: { apiuser: apiUser, apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function fapshiGet(path: string) {
  const apiUser = process.env.FAPSHI_API_USER!
  const apiKey = process.env.FAPSHI_API_KEY!
  const res = await fetch(`${FAPSHI_API_BASE}${path}`, {
    headers: { apiuser: apiUser, apikey: apiKey },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fapshi error ${res.status}: ${text}`)
  }
  return res.json()
}
```

#### QUERIES

**`listPaymentIntents`** — Liste les payment intents de l'utilisateur connecté, paginée.

```ts
export const listPaymentIntents = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
```

**`listAllPaymentIntents`** — Admin: tous les payment intents.

```ts
export const listAllPaymentIntents = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx as any)
    return await ctx.db
      .query('payment_intents')
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
```

#### ACTIONS

**`initiatePayment`** — Action principale pour initier un paiement Fapshi.

```ts
export const initiatePayment = action({
  args: {
    amountXaf: v.number(),
    redirectUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      phone: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      promoCode: v.optional(v.string()),
      promoDiscount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    paymentIntentId?: Id<'payment_intents'>
    checkoutUrl?: string
    transId?: string
    alreadyExists?: boolean
  }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const userId = identity.subject

    // 1. Calculer amountCents depuis XAF
    const xafRate = XAF_TO_USD_RATE
    const amountCents = Math.round((args.amountXaf / xafRate) * 100)

    // 2. Générer idempotencyKey
    const idempotencyKey = `initiate_${userId}_${Date.now()}`

    // 3. Vérifier idempotence
    const existing = await ctx.runQuery(
      internal.payment_intents.internalGetPaymentIntentByIdempotencyKey,
      { idempotencyKey }
    )
    if (existing) {
      return { success: true, paymentIntentId: existing._id, alreadyExists: true }
    }

    // 4. Créer le payment intent (status: pending)
    const paymentIntentId = await ctx.runMutation(
      internal.payment_intents.internalCreatePaymentIntent,
      {
        userId,
        amountCents,
        xafAmount: args.amountXaf,
        xafRate,
        idempotencyKey,
        metadata: args.metadata,
      }
    )

    // 5. Appeler Fapshi /initiate-pay
    try {
      const result = await fapshiPost('/initiate-pay', {
        amount: args.amountXaf,
        email: 'zer0num237@gmail.com',
        userId,
        externalId: paymentIntentId,
        message: 'Recharge num_zer0',
        redirectUrl: args.redirectUrl ?? `${process.env.VITE_SITE_URL || 'http://localhost:3000'}/payment/result`,
      })

      // 6. Mark as processing
      await ctx.runMutation(internal.payment_intents.internalMarkProcessing, {
        paymentIntentId,
        gatewayTransactionId: result.transId,
        checkoutUrl: result.link,
      })

      // 7. Log provider_operation
      await ctx.runMutation(internal.provider_operations.logOperation, {
        provider: 'fapshi',
        operation: 'initiate-pay',
        request: JSON.stringify({ amount: args.amountXaf, userId }),
        response: JSON.stringify(result),
        status: 'success',
        referenceId: paymentIntentId,
      })

      return {
        success: true,
        paymentIntentId,
        checkoutUrl: result.link,
        transId: result.transId,
      }
    } catch (err) {
      // 8. En cas d'erreur → mark failed + log error
      await ctx.runMutation(internal.payment_intents.internalMarkFailed, {
        paymentIntentId,
        reason: err instanceof Error ? err.message : 'Fapshi error',
      })

      await ctx.runMutation(internal.provider_operations.logOperation, {
        provider: 'fapshi',
        operation: 'initiate-pay',
        request: JSON.stringify({ amount: args.amountXaf, userId }),
        response: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        referenceId: paymentIntentId,
      })

      throw err
    }
  },
})
```

**`verifyPaymentIntent`** — Vérifie le statut Fapshi et confirme si SUCCESSFUL.

```ts
export const verifyPaymentIntent = action({
  args: {
    paymentIntentId: v.id('payment_intents'),
    gatewayTransactionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    status?: string
  }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const userId = identity.subject

    // 1. Lire le payment intent
    const pi = await ctx.runQuery(
      internal.payment_intents.internalGetPaymentIntentById,
      { paymentIntentId: args.paymentIntentId }
    )
    if (!pi) throw new Error('Payment intent not found')
    if (pi.userId !== userId) throw new Error('Forbidden')

    const transId = args.gatewayTransactionId ?? pi.gatewayTransactionId
    if (!transId) throw new Error('No gateway transaction ID')

    // 2. Appeler Fapshi /payment-status/:transId
    let fapshiStatus: string
    let fapshiResponse: Record<string, unknown>
    try {
      fapshiResponse = await fapshiGet(`/payment-status/${transId}`)
      fapshiStatus = fapshiResponse.status as string
    } catch (err) {
      await ctx.runMutation(internal.provider_operations.logOperation, {
        provider: 'fapshi',
        operation: 'payment-status',
        request: JSON.stringify({ transId }),
        response: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        referenceId: args.paymentIntentId,
      })
      throw err
    }

    // 3. Log provider_operation
    await ctx.runMutation(internal.provider_operations.logOperation, {
      provider: 'fapshi',
      operation: 'payment-status',
      request: JSON.stringify({ transId }),
      response: JSON.stringify(fapshiResponse),
      status: 'success',
      referenceId: args.paymentIntentId,
    })

    // 4. Selon le statut retourné par Fapshi
    if (fapshiStatus === 'SUCCESSFUL') {
      await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, {
        paymentIntentId: args.paymentIntentId,
        gatewayTransactionId: transId,
      })
      return { success: true, status: 'succeeded' }
    }

    if (fapshiStatus === 'FAILED') {
      await ctx.runMutation(internal.payment_intents.internalMarkFailed, {
        paymentIntentId: args.paymentIntentId,
        reason: 'Payment failed on Fapshi',
      })
      return { success: false, status: 'failed' }
    }

    if (fapshiStatus === 'EXPIRED') {
      await ctx.runMutation(internal.payment_intents.internalMarkExpired, {
        paymentIntentId: args.paymentIntentId,
      })
      return { success: false, status: 'expired' }
    }

    // CREATED ou PENDING → pas encore finalisé
    return { success: false, status: fapshiStatus.toLowerCase() }
  },
})
```

#### INTERNAL MUTATIONS

**`internalCreatePaymentIntent`** — Crée un nouveau payment intent (status: pending).

```ts
export const internalCreatePaymentIntent = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    xafAmount: v.number(),
    xafRate: v.number(),
    idempotencyKey: v.string(),
    metadata: v.optional(v.object({
      phone: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      promoCode: v.optional(v.string()),
      promoDiscount: v.optional(v.number()),
    })),
  },
  returns: v.id('payment_intents'),
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('payment_intents', {
      userId: args.userId,
      amountCents: args.amountCents,
      currency: 'USD',
      status: 'pending',
      gateway: 'fapshi',
      idempotencyKey: args.idempotencyKey,
      xafAmount: args.xafAmount,
      xafRate: args.xafRate,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

**`internalMarkProcessing`** — Marque comme "processing" une fois l'appel Fapshi réussi.

```ts
export const internalMarkProcessing = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    gatewayTransactionId: v.string(),
    checkoutUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentIntentId, {
      status: 'processing',
      gatewayTransactionId: args.gatewayTransactionId,
      updatedAt: Date.now(),
    })
  },
})
```

**`internalConfirmPaymentIntent`** — **IDEMPOTENTE** : confirme le paiement, crédite le wallet, créé l'order. Appelée par `verifyPaymentIntent` (action) et par le webhook.

```ts
export const internalConfirmPaymentIntent = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    gatewayTransactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')

    // IDEMPOTENCE : si déjà succeeded, ne rien faire
    if (pi.status === 'succeeded') return

    // Vérifier qu'on peut confirmer
    if (pi.status !== 'processing' && pi.status !== 'pending') {
      throw new Error(`Cannot confirm payment in status: ${pi.status}`)
    }

    const now = Date.now()

    // 1. Patcher le payment intent
    await ctx.db.patch(args.paymentIntentId, {
      status: 'succeeded',
      gatewayTransactionId: args.gatewayTransactionId ?? pi.gatewayTransactionId,
      updatedAt: now,
    })

    // 2. Créditer le wallet (via internalCreditWallet déjà existant)
    await ctx.runMutation(internal.wallet.internalCreditWallet, {
      userId: pi.userId,
      amountCents: pi.amountCents,
      referenceType: 'payment_intent',
      referenceId: args.paymentIntentId,
      description: `Recharge ${pi.xafAmount.toLocaleString('fr-FR')} FCFA`,
      metadata: { xafRate: pi.xafRate },
    })

    // 3. Créer l'order
    await ctx.db.insert('orders', {
      userId: pi.userId,
      type: 'recharge',
      status: 'completed',
      amountCents: pi.amountCents,
      paymentIntentId: args.paymentIntentId,
      description: `Recharge ${pi.xafAmount.toLocaleString('fr-FR')} FCFA`,
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

**`internalMarkFailed`** — Marque comme failed avec raison.

```ts
export const internalMarkFailed = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status === 'succeeded') return  // Idempotent: ne pas écraser succeeded
    await ctx.db.patch(args.paymentIntentId, {
      status: 'failed',
      failureReason: args.reason,
      updatedAt: Date.now(),
    })
  },
})
```

**`internalMarkExpired`** — Marque comme expired.

```ts
export const internalMarkExpired = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.status === 'succeeded') return
    await ctx.db.patch(args.paymentIntentId, {
      status: 'expired',
      updatedAt: Date.now(),
    })
  },
})
```

**`internalCancelPaymentIntent`** — Annulation utilisateur (paiement non encore traité).

```ts
export const internalCancelPaymentIntent = internalMutation({
  args: {
    paymentIntentId: v.id('payment_intents'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const pi = await ctx.db.get(args.paymentIntentId)
    if (!pi) throw new Error('Payment intent not found')
    if (pi.userId !== args.userId) throw new Error('Forbidden')
    if (pi.status !== 'pending') throw new Error('Cannot cancel non-pending payment')

    // Optionnel: appeler Fapshi /expire-pay si on a un gatewayTransactionId et que c'est un link
    // (cette logique reste dans une action si nécessaire)

    await ctx.db.patch(args.paymentIntentId, {
      status: 'cancelled',
      updatedAt: Date.now(),
    })
  },
})
```

#### INTERNAL QUERIES

```ts
export const internalGetPaymentIntentById = internalQuery({
  args: { paymentIntentId: v.id('payment_intents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentIntentId)
  },
})

export const internalGetPaymentIntentByIdempotencyKey = internalQuery({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', args.idempotencyKey))
      .unique()
  },
})

export const internalGetPaymentIntentByGatewayId = internalQuery({
  args: { gatewayTransactionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payment_intents')
      .withIndex('by_gatewayTransactionId', (q) => q.eq('gatewayTransactionId', args.gatewayTransactionId))
      .unique()
  },
})
```

### 4.3 Migrer le Webhook Existant

Le fichier `convex/http.ts` actuel appelle `api.purchases.handlePaymentSuccess` / `api.purchases.handlePaymentFailure`. Il faut le migrer pour utiliser `payment_intents` :

```ts
// NOUVEAU webhook (remplace l'ancien)
http.route({
  path: '/fapshi-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get('x-wh-secret')
    if (secret !== process.env.FAPSHI_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const transId: string = body.transId || ''
    const status: string = body.status || ''

    // Trouver le payment intent par gatewayTransactionId
    const pi = await ctx.runQuery(
      internal.payment_intents.internalGetPaymentIntentByGatewayId,
      { gatewayTransactionId: transId }
    )

    if (!pi) {
      // Fallback: c'est peut-être un ancien achat (purchases table)
      // À supprimer après migration complète
      await ctx.runMutation(api.purchases.handlePaymentSuccess, { transId, externalId: body.externalId || '' })
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (status === 'SUCCESSFUL') {
      await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, {
        paymentIntentId: pi._id,
        gatewayTransactionId: transId,
      })
    } else if (status === 'FAILED') {
      await ctx.runMutation(internal.payment_intents.internalMarkFailed, {
        paymentIntentId: pi._id,
        reason: `fapshi_webhook_failed`,
      })
    } else if (status === 'EXPIRED') {
      await ctx.runMutation(internal.payment_intents.internalMarkExpired, {
        paymentIntentId: pi._id,
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})
```

---

## 5. Risques Spécifiques

### 5.1 Convex Action Timeout (10 min) vs Fapshi Response Time

**Risque:** Les actions Convex timeout après 10 minutes. Un paiement direct mobile peut prendre plusieurs minutes (l'utilisateur reçoit une notification USSD, doit saisir son code PIN, etc.).

**Mitigation:**
- `initiatePayment` (création de lien/direct pay) est synchrone : Fapshi répond en < 5s. Pas de risque de timeout.
- `verifyPaymentIntent` est déclenchée par l'utilisateur (callback après paiement). Si l'utilisateur attend trop longtemps (> 10 min), l'action peut timeout.
- **Solution:** L'action `verifyPaymentIntent` ne doit pas attendre le paiement. Elle est appelée APRÈS que l'utilisateur a fini de payer (sur la page de retour/result). Le call Fapshi est immédiat (< 1s).
- **Alternative pour paiements longs:** Utiliser `ctx.scheduler.runAfter(0, ...)` pour déclencher une vérification asynchrone, puis le frontend poll le statut du payment intent. Mais ce pattern n'est pas nécessaire ici car la vérification est déclenchée manuellement.

### 5.2 Race Condition Webhook + Callback Utilisateur

**Risque LETAL:** Le webhook Fapshi et l'appel `verifyPaymentIntent` par l'utilisateur peuvent arriver **simultanément**. Les deux tentent de confirmer le même payment intent → double crédit wallet.

**Pourquoi c'est possible:**
1. L'utilisateur paie → Fapshi envoie le webhook
2. Simultanément, Fapshi redirige l'utilisateur vers `redirectUrl`
3. La page de callback appelle `verifyPaymentIntent`
4. Webhook + `verifyPaymentIntent` s'exécutent en parallèle

**Mitigation:**
- `internalConfirmPaymentIntent` est **idempotente** : elle vérifie `pi.status === 'succeeded'` et return early si déjà confirmé.
- Les deux appels arrivent sur des `ctx.runMutation` séparées. Grâce à l'atomicité Convex, la première mutation qui passe patch le status à 'succeeded'. La seconde voit 'succeeded' et ne fait rien.

**Scénario détaillé avec OCC:**
```
Time  │ Webhook (ctx.runMutation)         │ verifyPaymentIntent (ctx.runMutation)
──────┼────────────────────────────────────┼──────────────────────────────────────
T1    │ lit pi (status=processing)        │ lit pi (status=processing)
T2    │ vérifie status !== succeeded ✓     │ vérifie status !== succeeded ✓
T3    │ patch → succeeded                  │ (conflit OCC sur pi._id)
T4    │ credit wallet                      │
T5    │ insert order                      │
T6    │ commit ✓                          │
T7    │                                    │ OCC conflict → Convex RETRY
T8    │                                    │ relit pi (status=succeeded)
T9    │                                    │ vérifie status === succeeded → return early
T10   │                                    │ commit ✓ (no-op)
```

**Résultat:** Un seul credit wallet, un seul order. Idempotence garantie.

Ce mécanisme d'idempotence est **CRITIQUE** et doit être testé (Step 9).

### 5.3 Perte de l'Action en Cours si Crash Convex

**Risque:** Convex peut crash (infrastructure, bug, etc.) pendant l'exécution d'une action. Par exemple, après l'appel Fapshi (qui a réussi) mais avant le patch DB.

**Scénario:**
```
1. initiatePayment appelle Fapshi → Fapshi crée la transaction et retourne transId ✓
2. CRASH CONVEX (l'action est tuée)
3. Le payment intent reste en status 'pending' (jamais 'processing')
4. Le lien Fapshi existe et est valide, mais Convex n'a pas le gatewayTransactionId
```

**Mitigation:**
- **Phase 1:** Créer le payment intent EN AVANT de l'appel Fapshi (status: pending)
- **Phase 2:** Appeler Fapshi
- **Phase 3:** Marquer comme processing (avec gatewayTransactionId)

Si crash entre Phase 2 et Phase 3 :
- Le payment intent est en 'pending' sans gatewayTransactionId
- L'utilisateur peut réessayer → nouvelle idempotencyKey → nouveau payment intent
- Le lien Fapshi créé est "perdu" → il expire après 24h
- **Pas de perte financière:** personne n'a été crédité

**Solution plus robuste (Step 8):** Utiliser un scheduler pour vérifier les payment intents en 'pending' de longue durée et les nettoyer.

### 5.4 Idempotence Fragile : Double Soumission

**Risque:** L'utilisateur clique deux fois sur "Payer" → deux appels `initiatePayment`.

**Mitigation:**
- L'idempotencyKey est générée côté client OU dans une mutation préalable
- `internalCreatePaymentIntent` vérifie l'idempotencyKey avant d'insérer
- Si la clé existe déjà, retourner le payment intent existant

**Limite:** L'idempotencyKey doit être unique. Actuellement générée avec `Date.now()` côté action → si deux clics arrivent dans la même ms, l'idempotencyKey est identique.

**Amélioration:** Ajouter un `crypto.randomUUID()` dans l'idempotencyKey :
```ts
const idempotencyKey = `initiate_${userId}_${Date.now()}_${crypto.randomUUID()}`
```

Mieux : générer l'idempotencyKey dans une mutation préalable appelée par le frontend avant l'action.

### 5.5 Rate Limiting Fapshi (6 req/min)

**Risque:** Fapshi limite à 6 requests/minute par transId pour `/payment-status`. Si plusieurs clients vérifient le même transId, ils peuvent être bloqués.

**Mitigation:**
- Le webhook est le mécanisme principal → pas de polling
- `verifyPaymentIntent` n'est appelée qu'une fois par l'utilisateur (sur la page de résultat)
- Si le webhook arrive en premier, `internalConfirmPaymentIntent` est déjà passée → le statut est 'succeeded' → l'utilisateur voit le succès sans avoir besoin de vérifier
- L'action `verifyPaymentIntent` ne devrait être utilisée qu'en fallback (si webhook pas encore reçu)

### 5.6 Migration de l'Ancien Code (purchases.ts)

**Risque:** Le code existant dans `purchases.ts` (initiateDirectPay, verifyPurchase, handlePaymentSuccess) continuera de fonctionner pendant la transition.

**Stratégie:**
1. Créer `payment_intents.ts` (ce module) — NOUVEAU flux
2. Mettre à jour `http.ts` pour gérer les nouveaux payment intents (tout en gardant le fallback vers purchases)
3. Marquer l'ancien code comme `@deprecated`
4. Migrer les clients frontend un par un
5. Supprimer l'ancien code après migration complète

### 5.7 Vérification Pré-Déploiement

```bash
# 1. Vérifier que le module typecheck
npx tsc --noEmit

# 2. Vérifier la limite 200 lignes (< 200 pour payment_intents.ts)
wc -l convex/payment_intents.ts

# 3. Vérifier que tous les imports internal sont corrects
grep -n "internal\." convex/payment_intents.ts

# 4. Vérifier les index utilisés dans les queries
grep -n "withIndex" convex/payment_intents.ts

# 5. Lancer les tests payment (Step 9)
npx convex run --file convex/tests/test_payment_intents.ts
```

---

## 6. Code Exact pour `payment_intents.ts`

Voir le fichier final implémenté dans `convex/payment_intents.ts` avec les sections suivantes :

1. **Imports** : `action`, `internalAction`, `query`, `internalMutation`, `internalQuery` depuis `./_generated/server` ; `v` depuis `convex/values` ; `internal` depuis `./_generated/api` ; `Id` depuis `./_generated/dataModel` ; `paginationOptsValidator` depuis `convex/server` ; `requireAuth` depuis `./lib/auth_helpers` ; `fapshiPost`, `fapshiGet` depuis `./lib/fapshi` ; `XAF_TO_USD_RATE` depuis `./lib/rates`

2. **Queries publiques** (auth requise):
   - `listPaymentIntents` — paginée par userId
   - `listAllPaymentIntents` — admin, tous les intents paginés

3. **Actions publiques**:
   - `initiatePayment` — créer + initier chez Fapshi
   - `verifyPaymentIntent` — vérifier statut + confirmer si succès

4. **Internal mutations**:
   - `internalCreatePaymentIntent`
   - `internalMarkProcessing`
   - `internalConfirmPaymentIntent` (idempotente)
   - `internalMarkFailed` (idempotente, ne pas écraser succeeded)
   - `internalMarkExpired` (idempotente)
   - `internalCancelPaymentIntent` (user-initiated, vérifie propriété)

5. **Internal queries**:
   - `internalGetPaymentIntentById`
   - `internalGetPaymentIntentByIdempotencyKey`
   - `internalGetPaymentIntentByGatewayId`
