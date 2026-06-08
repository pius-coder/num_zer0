# Research: Convex Wallet + Ledger Backend (Step 4)

**Date:** 2026-06-08
**Objectif:** Implémenter `convex/wallet.ts` — backend wallet avec ledger immutable, vérification de solde atomique, et pagination.

---

## 1. Sources Consultées

| Source | URL | Contenu clé |
|--------|-----|-------------|
| Mutations (docs officielles) | https://docs.convex.dev/functions/mutation-functions | Atomicité transactionnelle, `mutation` vs `internalMutation`, MutationCtx |
| Reading data (docs officielles) | https://docs.convex.dev/database/reading-data | `.take(n)`, `.first()`, `.unique()`, `.paginate()`, `.order("desc")`, pagination cursor |
| Indexes (docs officielles) | https://docs.convex.dev/database/reading-data/indexes | `.withIndex()`, compound indexes, range expressions, limits |
| Paginated Queries (docs officielles) | https://docs.convex.dev/database/pagination | `paginate()`, `PaginationOptions`, `usePaginatedQuery`, cursor-based |
| Limits (docs officielles) | https://docs.convex.dev/production/state/limits | 32,000 docs scannés, 16 MiB read/write, mutation 1s timeout |
| Schema (docs officielles) | https://docs.convex.dev/database/schemas | `defineSchema`, `defineTable`, `v.id()`, `v.union()` |
| Validators (docs officielles) | https://docs.convex.dev/api/modules/validator | `v.string()`, `v.number()`, `v.object()`, `v.optional()` |
| Queries that scale (stack.convex.dev) | https://stack.convex.dev/queries-that-scale | Hot documents, index perf, split frequently-updated fields |
| Codebase: `convex/comptabilite.ts` | `/home/ubuntu/num_zer0/convex/comptabilite.ts` | Legacy credit/debit pattern (sans ledger entries) |
| Codebase: `convex/users.ts` | `/home/ubuntu/num_zer0/convex/users.ts` | Auth pattern, `requireAuth`/`requireAdmin` usages |
| Codebase: `convex/lib/auth_helpers.ts` | `/home/ubuntu/num_zer0/convex/lib/auth_helpers.ts` | `requireAuth()`, `requireAdmin()` helpers |
| Codebase: `convex/schema.ts` | `/home/ubuntu/num_zer0/convex/schema.ts` | Tables `wallets` et `wallet_ledger_entries` déjà définies (Step 1) |
| Codebase: `convex/auth.ts` | `/home/ubuntu/num_zer0/convex/auth.ts` | BetterAuth integration, `getCurrentUser`, `syncUser` |

---

## 2. Règles Convex pour Ledger Atomique

### 2.1 Atomicité des mutations Convex

**Principe fondamental:** Toute mutation Convex est **automatiquement transactionnelle** :

1. Tous les `ctx.db` reads dans la mutation voient une **snapshot cohérente** des données. Pas de lecture sale.
2. Toutes les écritures (`insert`, `patch`, `delete`) sont **committed ensemble** ou **rollback ensemble**.
3. Si la mutation throw une erreur, **aucune écriture n'est persistée**.

```ts
// CETTE MUTATION EST ATOMIQUE :
export const internalCreditWallet = internalMutation({
  args: { walletId: v.id('wallets'), amountCents: v.number(), /* ... */ },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId)
    // ↑ lecture cohérente — personne ne modifie wallet entre cette ligne et le commit
    
    const newBalance = wallet.balanceCents + args.amountCents
    // ↑ calcul basé sur la snapshot cohérente
    
    await ctx.db.patch(args.walletId, { balanceCents: newBalance, updatedAt: Date.now() })
    // ↑ patch wallet
    
    await ctx.db.insert('wallet_ledger_entries', {
      walletId: args.walletId,
      amountCents: args.amountCents,
      balanceAfterCents: newBalance,
      // ...
    })
    // ↑ insert ledger entry
    
    // Si une ligne ci-dessus throw → tout est rollback
    // Si tout réussit → wallet patch + ledger insert commit atomiquement
  },
})
```

**Source:** https://docs.convex.dev/functions/mutation-functions#transactions
> "Mutations run transactionally. All database reads inside the transaction get a consistent view of the data. All database writes get committed together."

### 2.2 OCC Conflict sur le document wallet

**Mécanisme:** Convex utilise **Optimistic Concurrency Control (OCC)**. Si deux mutations concurrentes lisent le même document wallet puis tentent de l'écrire :

1. La première mutation commit normalement
2. La seconde mutation détecte que le document wallet a changé depuis sa lecture → **OCC conflict**
3. Convex **rejoue automatiquement** la seconde mutation depuis le début

**Conséquence pour le wallet:** Le document `wallets` est un **hot document potentiel** — toute opération de crédit/débit passe par lui. L'OCC détecte les conflits et retry.

```ts
// Scénario race condition :
// Mutation A crédite 1000 → lit wallet (balance=5000), calcule 6000, patch
// Mutation B crédite 2000 → lit wallet (balance=5000), calcule 7000, patch
//
// Si A committe avant B :
//   1. A commit : wallet.balanceCents = 6000 ✓
//   2. B détecte que wallet.balanceCents !== 5000 → OCC conflict
//   3. Convex retry B : relit wallet (balance=6000), calcule 8000, patch ✓
//
// Résultat final : 8000. Aucune perte.
```

**Limite du retry automatique:** Convex retry automatiquement mais si le conflit persiste (ex: debit massif sur le même wallet), la mutation peut échouer après plusieurs tentatives. Dans la pratique, pour un wallet utilisateur standard, les conflits sont rares.

### 2.3 Pourquoi une mutation suffit (pas de transaction cross-mutation)

**Règle:** Il n'existe PAS de concept de "transaction multi-mutation" dans Convex.

Mais ce n'est PAS un problème car :

1. **Toute la logique (lire wallet → vérifier solde → patch wallet → insert ledger) est dans une SEULE mutation** → atomique par construction
2. **Les appels `ctx.runMutation()` sont dans la même transaction** — un appel de mutation dans une mutation est traité comme une sous-opération dans la même transaction
3. **Aucun besoin de transaction cross-mutation** car credit/debit sont unitaires

```ts
// BON : tout dans une mutation
export const internalDebitWallet = internalMutation({
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId)       // read
    if (wallet.balanceCents < args.amountCents) throw ... // vérif
    const newBalance = wallet.balanceCents - args.amountCents // calc
    await ctx.db.patch(args.walletId, { balanceCents: newBalance }) // write 1
    await ctx.db.insert('wallet_ledger_entries', { ... }) // write 2
  }
  // 1 transaction : read + vérif + write1 + write2 → atomique
})
```

### 2.4 `mutation` vs `internalMutation`

| Type | Accessible depuis | Quand utiliser |
|------|------------------|----------------|
| `mutation` | Frontend + `ctx.runMutation()` | Mutations publiques appelées par l'UI |
| `internalMutation` | `ctx.runMutation()` uniquement | Mutations internes (wallet, escrow, scheduler) |

**Règle pour wallet.ts:** Toutes les fonctions wallet sont des `internalMutation` car :
- `internalGetOrCreateWallet` — créé par `confirmPaymentIntent` ou `holdEscrow`
- `internalCreditWallet` — appelé par `confirmPaymentIntent` ou `refundEscrow`
- `internalDebitWallet` — appelé par `holdEscrow`
- Aucune n'est appelée directement par le frontend

Les queries `getBalance`, `getLedger`, `getWalletByUserId` sont des `query` publiques.

### 2.5 Limite 32,000 documents scannés

**Règle:** Une mutation ou query ne peut pas scanner plus de **32,000 documents**. `.collect()` scanne TOUS les documents qui matchent l'index range.

**Pour le ledger:** Ne JAMAIS utiliser `.collect()` sur `wallet_ledger_entries`. Utiliser :
- `.paginate()` pour le frontend (cursor-based, lazy)
- `.take(50)` avec index `by_walletId_createdAt` pour les queries limitées
- Mutations avec `get` par ID (pas de scan)

```ts
// MAUVAIS : scanne potentiellement des millions d'entrées
const entries = await ctx.db.query('wallet_ledger_entries').collect()

// BON : pagination cursor-based
const results = await ctx.db
  .query('wallet_ledger_entries')
  .withIndex('by_walletId_createdAt', (q) => q.eq('walletId', walletId))
  .order('desc')
  .paginate(args.paginationOpts)

// BON : take limité pour des cas spécifiques
const last10 = await ctx.db
  .query('wallet_ledger_entries')
  .withIndex('by_walletId_createdAt', (q) => q.eq('walletId', walletId))
  .order('desc')
  .take(10)
```

---

## 3. Pattern Auth à Reproduire

### 3.1 `requireAuth` (dans `convex/lib/auth_helpers.ts`)

```ts
import type { QueryCtx, MutationCtx } from '../_generated/server'

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity
}
```

**Usage dans les queries wallet :**
```ts
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    // identity.subject = BetterAuth userId (string)
    // ctx.db.query('wallets').withIndex('by_userId', (q) => q.eq('userId', identity.subject))
  },
})
```

### 3.2 `requireAdmin` (dans `convex/lib/auth_helpers.ts`)

```ts
export async function requireAdmin(ctx: MutationCtx) {
  const identity = await requireAuth(ctx)
  const user = await ctx.db
    .query('users')
    .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
    .unique()
  if (!user?.isAdmin) throw new Error('Unauthorized: admin access required')
  return { identity, user }
}
```

**Usage dans les queries admin wallet :**
```ts
export const getAllWallets = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx as any)  // QueryCtx compatible avec requireAdmin
    return await ctx.db.query('wallets').order('desc').collect()
  },
})
```

**Note:** `requireAdmin` prend `MutationCtx` dans sa signature mais est utilisée avec `QueryCtx` dans `getAllWallets` (admin query). Le helper est compatible car `QueryCtx` a `auth` et `db`. L'assertion `as any` est un compromis accepté dans le codebase existant (voir `comptabilite.ts:192`).

---

## 4. Plan d'Implémentation Concret — `convex/wallet.ts`

### 4.1 `getBalance` — query publique avec auth

```ts
import { query } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/auth_helpers'

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx)
    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()
    if (!wallet) return { balanceCents: 0, currency: 'USD', userId: identity.subject }
    return { balanceCents: wallet.balanceCents, currency: wallet.currency, userId: wallet.userId }
  },
})
```

### 4.2 `getLedger` — query publique paginée avec auth

```ts
import { paginationOptsValidator } from 'convex/server'

export const getLedger = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const wallet = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .first()
    if (!wallet) return { page: [], continueCursor: '', isDone: true }
    return await ctx.db
      .query('wallet_ledger_entries')
      .withIndex('by_walletId_createdAt', (q) => q.eq('walletId', wallet._id))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
```

### 4.3 `internalGetOrCreateWallet` — internalMutation

```ts
import { internalMutation } from './_generated/server'

export const internalGetOrCreateWallet = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
    if (existing) return existing._id
    const now = Date.now()
    return await ctx.db.insert('wallets', {
      userId: args.userId,
      balanceCents: 0,
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

### 4.4 `internalCreditWallet` — internalMutation atomique

**Atomique :** patch wallet + insert ledger entry dans la MÊME mutation.

```ts
export const internalCreditWallet = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    referenceType: v.union(
      v.literal('payment_intent'),
      v.literal('escrow'),
      v.literal('order'),
      v.literal('admin'),
    ),
    referenceId: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
  },
  handler: async (ctx, args) => {
    const walletId = await ctx.runMutation(internal.wallet.internalGetOrCreateWallet, {
      userId: args.userId,
    })
    const wallet = await ctx.db.get(walletId)
    if (!wallet) throw new Error('Wallet not found')

    const newBalance = wallet.balanceCents + args.amountCents
    const now = Date.now()

    await ctx.db.patch(walletId, { balanceCents: newBalance, updatedAt: now })
    // ↑ OCC lock : si un conflit arrive, Convex retry toute la mutation

    await ctx.db.insert('wallet_ledger_entries', {
      walletId,
      type: 'credit',
      amountCents: args.amountCents,
      balanceAfterCents: newBalance,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      description: args.description,
      metadata: args.metadata,
      createdAt: now,
    })

    return { balanceAfterCents: newBalance }
  },
})
```

**Pourquoi c'est atomique :**
1. `ctx.db.get(walletId)` lit le wallet dans la snapshot courante
2. `ctx.db.patch(walletId, ...)` écrit le nouveau solde
3. `ctx.db.insert('wallet_ledger_entries', ...)` crée l'entrée ledger
4. Si n'importe quelle étape échoue → **tout est rollback**
5. Si OCC conflict sur walletId → **Convex retry la mutation entière**

### 4.5 `internalDebitWallet` — internalMutation atomique (vérification + débit)

**IMPORTANT :** La vérification de solde ET le débit sont dans la MÊME mutation. C'est ce qui garantit l'atomicité.

```ts
export const internalDebitWallet = internalMutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    referenceType: v.union(
      v.literal('payment_intent'),
      v.literal('escrow'),
      v.literal('order'),
      v.literal('admin'),
    ),
    referenceId: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({ xafRate: v.optional(v.number()) })),
  },
  handler: async (ctx, args) => {
    const walletId = await ctx.runMutation(internal.wallet.internalGetOrCreateWallet, {
      userId: args.userId,
    })
    const wallet = await ctx.db.get(walletId)
    if (!wallet) throw new Error('Wallet not found')

    if (wallet.balanceCents < args.amountCents) {
      throw new Error('Insufficient balance')
    }
    // ↑ La vérification est faite dans la MÊME transaction que le débit
    //   Impossible qu'un crédit concurrent passe entre la vérif et le patch

    const newBalance = wallet.balanceCents - args.amountCents
    const now = Date.now()

    await ctx.db.patch(walletId, { balanceCents: newBalance, updatedAt: now })
    // ↑ OCC lock : si wallet est modifié entre la lecture et ce patch,
    //   Convex retry toute la mutation → ré-exécute la vérification

    await ctx.db.insert('wallet_ledger_entries', {
      walletId,
      type: 'debit',
      amountCents: args.amountCents,
      balanceAfterCents: newBalance,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      description: args.description,
      metadata: args.metadata,
      createdAt: now,
    })

    return { balanceAfterCents: newBalance }
  },
})
```

**Garantie offerte :**
- Vérification de solde ET débit atomiques
- Pas de race condition T1 vérifie → T2 crédite → T1 débite (OCC détecte et retry)
- Le ledger entry `balanceAfterCents` reflète toujours le solde réel après l'opération

### 4.6 `getAllWallets` — query admin

```ts
export const getAllWallets = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireAdmin(ctx as any)
    return await ctx.db.query('wallets').order('desc').collect()
  },
})
```

### 4.7 `getWalletByUserId` — query avec auth

```ts
export const getWalletByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    if (identity.subject !== args.userId) throw new Error('Unauthorized')
    return await ctx.db
      .query('wallets')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
  },
})
```

---

## 5. Risques Identifiés

### 5.1 Hot document wallet

**Risque:** Le document `wallets` est un **hot document** — toutes les mutations de crédit/débit écrivent sur le même document. À très haute fréquence (plusieurs mutations par seconde sur le MÊME wallet), les OCC conflicts deviennent fréquents et les retry peuvent échouer.

**Mitigation:**
- Chaque wallet est par utilisateur → réparti sur tous les utilisateurs (pas un wallet global)
- Pour un utilisateur seul, la fréquence de crédit/débit est faible
- Si besoin de scaling : sharding (plusieurs documents wallet agrégés)

### 5.2 Race condition vérification solde + débit

**Risque:** Deux mutations `internalDebitWallet` simultanées sur le même wallet pourraient toutes deux passer la vérification de solde avant que l'une des deux ne commit.

**Mitigation:** C'est exactement ce que l'OCC empêche. Le scénario :
1. Mut A lit wallet (balance=100), Mut B lit wallet (balance=100)
2. Toutes les deux vérifient 100 >= 50 → OK
3. Mut A patch à 50 et commit
4. Mut B tente de patch à 50 → **OCC conflict** car le document a changé depuis sa lecture
5. Convex retry Mut B : relit wallet (balance=50), vérifie 50 >= 50 → OK, patch à 0, commit

**Résultat correct :** balance finale = 0. Pas de découvert.

### 5.3 Incohérence ledger-balance

**Risque:** Si le patch wallet réussit mais l'insert ledger échoue (timeout, OCC), la balance est modifiée sans trace.

**Mitigation:** Impossible dans une mutation Convex — tout ou rien. Si l'insert échoue, le patch est aussi rollback. L'atomicité est garantie par le runtime Convex.

### 5.4 `internalGetOrCreateWallet` appelé par `ctx.runMutation`

**Risque:** `internalGetOrCreateWallet` est appelé via `ctx.runMutation()` dans `internalCreditWallet`/`internalDebitWallet`. C'est une sous-mutation dans la mutation parente.

**Conséquence:** La sous-mutation `internalGetOrCreateWallet` est EXCLUE de la transaction parente. Si la mutation parente rollback, la création du wallet (si c'était le premier appel) n'est PAS rollback.

**Mitigation:** `internalGetOrCreateWallet` est idempotent (retourne l'existant si déjà créé). Un wallet orphelin (créé puis mutation rollback) a balanceCents=0 et est inoffensif. C'est un pattern accepté.

### 5.5 Vérification pré-déploiement

```bash
# 1. Vérifier que le module typecheck
npx tsc --noEmit

# 2. Vérifier la limite 200 lignes (< 200 pour wallet.ts)
wc -l convex/wallet.ts

# 3. Lancer les tests wallet (Step 9)
npx convex run --file convex/tests/test_wallet.ts

# 4. Vérifier que les imports internal sont corrects
grep -n "internal\." convex/wallet.ts
# Doit pointer vers internal.wallet.internalGetOrCreateWallet
```
