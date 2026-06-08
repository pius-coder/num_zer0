# Phase 3 — Recherche Backend

**Issue:** ISSUE-013-payment-wallet-escrow-refonte  
**Date:** 2026-06-08  
**Agent:** subagent recherche (backend)  
**Objectif:** Règles Convex pour refonte schema/ledger/idempotence, migration no-legacy, limites transactionnelles, pattern auth serveur, risques performance ledger.

---

## Sources consultées

| Source | Raison |
|--------|--------|
| `AGENTS.md` | Conventions projet, Convex + React Query patterns, feature lifecycle |
| `issues/TEMPLATE.md` | Workflow obligatoire phases 1-8 |
| `.agents/skills/convex-migration-helper/SKILL.md` | Widen → migrate → narrow, idempotence, déploiements multi-step |
| `.agents/skills/convex-migration-helper/references/migration-patterns.md` | Dual write/read, backfill, split tables, small-table shortcut |
| `.agents/skills/convex-setup-auth/SKILL.md` | `ctx.auth.getUserIdentity()` côté serveur, pas de userId client |
| `.agents/skills/convex-performance-audit/SKILL.md` | Hot path rules, OCC conflicts, subscription cost, function budget |
| `.agents/skills/convex-performance-audit/references/hot-path-rules.md` | Indexes, denormalization, digest tables, consistency |
| `.agents/skills/convex-performance-audit/references/occ-conflicts.md` | Hot document splitting, read set size, sharded counters |
| `.agents/skills/convex-performance-audit/references/function-budget.md` | Limites Convex: 1s mutation, 16MiB, 32000 scan, 16000 write |
| `.agents/skills/convex-performance-audit/references/subscription-cost.md` | Point-in-time reads, digest tables, `Date.now()` dans queries |
| `01-exploration-backend.md` | Cartographie complète du code legacy |
| `02-lecture-backend.md` | Analyse détaillée des flux, race conditions, idempotence absente |
| `02-lecture-frontend.md` | Contrats frontend, hooks, query keys, invalidations |
| [Convex limits docs](https://docs.convex.dev/production/state/limits) | Limites transactionnelles officielles |

---

## Règle 1 : Modèle de données — Domaines purs, tables dédiées

Chaque concept financier a sa propre table. Aucun mélange de rôles (le legacy utilise `comptes` à la fois comme wallet, escrow, et compte de résultat).

### Tables cible

```
payment_intents:
  userId: Id<"users">
  gateway: string                // "fapshi" | "stripe" | etc.
  gatewayTransactionId: v.optional(v.string())
  amountCents: v.number()        // USD cents (integer)
  currency: v.string()            // "USD" | "XAF"
  status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("failed"), v.literal("expired"))
  idempotencyKey: v.string()
  metadata: v.optional(v.object({ promoCode: v.optional(v.string()), promoDiscountCents: v.optional(v.number()) }))
index by_user: ["userId"]
index by_gateway_tx: ["gatewayTransactionId"]
index by_idempotency_key: ["idempotencyKey"]

wallets:
  userId: Id<"users">
  balanceCents: v.number()       // USD cents, denormalized for fast reads
  currency: v.string()            // "USD"
  createdAt: v.number()
  updatedAt: v.number()
index by_user: ["userId"]

wallet_ledger_entries:
  walletId: Id<"wallets">
  type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("escrow_hold"), v.literal("escrow_release"), v.literal("escrow_refund"))
  amountCents: v.number()        // positif = credit, negatif = debit
  balanceAfterCents: v.number()
  referenceType: v.string()       // "payment_intent" | "escrow" | "order"
  referenceId: v.string()
  description: v.string()
  idempotencyKey: v.string()
  createdAt: v.number()
index by_wallet: ["walletId"]
index by_reference: ["referenceType", "referenceId"]
index by_idempotency_key: ["idempotencyKey"]

escrows:
  activationId: Id<"activations">
  userId: Id<"users">
  amountCents: v.number()
  status: v.union(v.literal("held"), v.literal("released"), v.literal("refunded"), v.literal("partially_released"))
  heldAt: v.number()
  releasedAt: v.optional(v.number())
  refundedAt: v.optional(v.number())
  idempotencyKey: v.string()
index by_activation: ["activationId"]
index by_user: ["userId"]
index by_status: ["status"]
index by_idempotency_key: ["idempotencyKey"]

orders:
  userId: Id<"users">
  type: v.union(v.literal("recharge"), v.literal("activation"), v.literal("rental"))
  paymentIntentId: v.optional(v.id("payment_intents"))
  amountCents: v.number()
  status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))
  createdAt: v.number()
index by_user: ["userId"]
index by_payment_intent: ["paymentIntentId"]
```

### Règles dérivées

1. **Montants en cents entiers** — jamais de `number` flottant. `priceXaf` / 600 → perte de précision. USD cents = entier.
2. **`idempotencyKey` avec index sur chaque table financière** — Convex n'a pas de contrainte `unique`, donc le pattern est check-before-write : `query().withIndex("by_idempotency_key", q => q.eq("key", key)).first()` avant d'insérer.
3. **`wallet_ledger_entries.balanceAfterCents`** = snapshot du solde après l'opération. Permet les requêtes de rejeu et vérification sans recalcul.
4. **`wallets.balanceCents`** = cache dénormalisé. Mis à jour dans la même mutation que l'insertion ledger. Utilise OCC de Convex pour garantir la cohérence (mutation atomique). Vérifiable par cron : `sum(entries) === balanceCents`.

---

## Règle 2 : Idempotence — Check-before-write atomique

Convex n'a PAS de contrainte `unique` sur les indexes. L'idempotence repose donc sur un pattern **check-before-write** à l'intérieur d'une seule mutation.

### Pattern idempotent pour payment_intents.create

```ts
export const createPaymentIntent = mutation({
  args: {
    amountCents: v.number(),
    gateway: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    // find user

    // Check idempotence
    const existing = await ctx.db
      .query("payment_intents")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first()
    if (existing) return existing

    // Create
    return await ctx.db.insert("payment_intents", {
      userId: user._id,
      gateway: args.gateway,
      amountCents: args.amountCents,
      currency: "USD",
      status: "pending",
      idempotencyKey: args.idempotencyKey,
      metadata: undefined,
    })
  },
})
```

**Risque résiduel** : si deux mutations avec la même `idempotencyKey` arrivent exactement en même temps, Convex OCC les exécute séquentiellement. La première insère, la seconde refait le check et trouve l'enregistrement existant → safe.

### Pattern idempotent pour ledger (wallet_ledger_entries.insert)

Même check-before-write. La mutation qui crédite/débite le wallet doit :
1. Check idempotence sur `wallet_ledger_entries`
2. Read `wallets.balanceCents`
3. Compute nouveau solde
4. Insert `wallet_ledger_entries` avec `balanceAfterCents`
5. Patch `wallets.balanceCents`

**Tout dans la même mutation** → atomique. Si une étape échoue (OCC conflict sur le wallet), Convex retry automatiquement la mutation complète.

---

## Règle 3 : Atomicité des opérations ledger — Une mutation = une transaction

### Legacy (ce qui ne va pas)
```ts
// comptabilite.ts:createPiece — PAS atomique
for (const ligne of args.lignes) {
  if (ligne.sens === 'credit') await creditCompte(ctx, { compteCode: ligne.compteCode, montant: ligne.montant })
  else await debitCompte(ctx, { compteCode: ligne.compteCode, montant: ligne.montant })
  await ctx.db.insert('lignes', { pieceId: pieceId, ...ligne, soldeApres: nouveauSolde })
}
```
Chaque `creditCompte` et `debitCompte` est une mutation séparée. Si la 3e ligne échoue, les 2 premières sont déjà commitées → **incohérence**.

### Nouveau pattern (atomique)
```ts
export const holdEscrow = internalMutation({
  args: {
    userId: v.id("users"),
    activationId: v.id("activations"),
    amountCents: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Check idempotence
    const existing = await ctx.db.query("wallet_ledger_entries")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first()
    if (existing) return existing

    // 2. Read wallet user
    const wallet = await ctx.db.query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    if (!wallet || wallet.balanceCents < args.amountCents) throw new Error("Insufficient balance")

    const newBalance = wallet.balanceCents - args.amountCents

    // 3. Insert entry ledger
    await ctx.db.insert("wallet_ledger_entries", {
      walletId: wallet._id,
      type: "escrow_hold",
      amountCents: -args.amountCents,
      balanceAfterCents: newBalance,
      referenceType: "escrow",
      referenceId: args.activationId,
      description: "Hold escrow for activation",
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    })

    // 4. Patch wallet balance (dans la même mutation)
    await ctx.db.patch(wallet._id, { balanceCents: newBalance, updatedAt: Date.now() })

    // 5. Create escrow record
    await ctx.db.insert("escrows", {
      activationId: args.activationId,
      userId: args.userId,
      amountCents: args.amountCents,
      status: "held",
      heldAt: Date.now(),
      idempotencyKey: args.idempotencyKey + "_escrow",
    })
  },
})
```

**Propriété** : si l'insertion de l'escrow échoue, le patch du wallet et l'insertion ledger sont automatiquement rollbackés par Convex. La mutation est atomique.

---

## Règle 4 : Escrow explicite — Machine à états typée

### Legacy
Escrow implicite dans `pieces`/`lignes` avec statuts string libres. `refundEscrow` cherche par `reference` et `.first()` → fragile.

### Cible — États de l'escrow

```
held → released (activation réussie)
held → refunded (activation annulée/expirée)
held → partially_released (coût réel < montant bloqué, remboursement partiel)
```

### Règles

1. Chaque escrow est lié à une activation par `escrows.activationId`.
2. Une activation ne peut avoir qu'un seul escrow actif à la fois (vérifiable par index + check).
3. Les transitions sont protégées : `released` ou `refunded` ne peuvent pas être redéclarées (idempotence).
4. `completeActivation` appelle `releaseEscrow(activationId)`, `cancelActivation` appelle `refundEscrow(activationId)`.
5. `releaseEscrow` et `refundEscrow` sont mutuellement exclusives — un escrow `released` ne peut pas être `refunded` et vice-versa. Vérifier `escrow.status` avant d'agir.

---

## Règle 5 : Migration no-legacy — Stratégie en 3 phases

La contrainte "pas de backward compat" permet de supprimer l'ancien code mais nécessite de migrer les données actives.

### Phase A — Déploiement des nouvelles tables + nouveau code
1. Ajouter les tables `payment_intents`, `wallets`, `wallet_ledger_entries`, `escrows`, `orders` au `schema.ts`.
2. Ne PAS supprimer les anciennes tables (`comptes`, `pieces`, `lignes`, `purchases`, `packages`, `users.balanceUsd`, `users.hasMadeDeposit`).
3. Créer les nouveaux modules Convex (`convex/wallet.ts`, `convex/payment_intents.ts`, `convex/escrows.ts`, `convex/orders.ts`).
4. Le nouveau code n'écrit QUE dans les nouvelles tables.
5. Pendant cette phase, le frontend utilise encore les anciens hooks (lecture seule sur les anciennes données).

### Phase B — Migration des données actives
Utiliser `@convex-dev/migrations` pour :
1. **Balances wallets** : Pour chaque `compte(411-{userId})`, créer un `wallets` avec `balanceCents = Math.round(solde * 100)`.
2. **Escrows actifs** : Pour chaque activation avec status `awaiting_number|awaiting_sms|sms_received`, créer un `escrows(held)`. Le montant vient de `priceCharged`.
3. **Payment intents** : Pour chaque `purchases(status='confirmed')`, créer un `payment_intents(succeeded)`.
4. **Orders** : Pour chaque `purchases`, créer un `orders`.

**Séquençage important** : les activations en cours (escrow actif) doivent être migrées AVANT la bascule des flux. Sinon, `completeActivation` ne trouvera pas l'escrow.

### Phase C — Bascule des flux + suppression legacy
1. Déployer les nouveaux hooks frontend qui pointent vers les nouvelles queries/mutations.
2. Déployer les nouveaux composants frontend (recharge, wallet, admin).
3. Après confirmation que plus aucun code ne lit les anciennes tables :
   - Supprimer `convex/purchases.ts`, `convex/comptabilite.ts`, `convex/packages.ts`
   - Nettoyer `schema.ts` : retirer `purchases`, `comptes`, `pieces`, `lignes`, `packages`, `users.balanceUsd`, `users.hasMadeDeposit`
   - `npx convex deploy --type=forceWithSchemaChanges` (nécessaire car suppression de colonnes)

---

## Règle 6 : Limites transactionnelles Convex

### Les limites (source: docs.convex.dev)

| Ressource | Limite | Impact sur le nouveau ledger |
|---|---|---|
| Exécution mutation | 1s | Une mutation ledger = 3-5 ops DB → safe |
| Data read per tx | 16 MiB | Safe pour une lecture wallet |
| Data written per tx | 16 MiB | Une ligne ledger ~ 200 bytes → ~80000 par tx |
| Docs scanned per tx | 32000 | Pagination obligatoire sur `wallet_ledger_entries` |
| Index ranges read | 4096 | Chaque `.withIndex()` + `.first()` = 1 range |
| Docs written per tx | 16000 | Limite haute : ne pas batch-insérer plus de 16000 entries |
| Doc size | 1 MiB | `wallet_ledger_entries` = ~200 bytes → safe |

### Règles dérivées

1. **Pagination obligatoire** sur `wallet_ledger_entries` : `.withIndex("by_wallet", q => q.eq("walletId", id)).order("desc").take(50)`. Ne jamais `.collect()`.
2. **Batch limité** pour les migrations : utiliser `@convex-dev/migrations` (cursor-based, self-scheduling) plutôt que `.collect()`.
3. **Pas de `Date.now()` dans les queries** — cela défait le cache Convex et force des réévaluations inutiles. Passer le timestamp comme argument client avec arrondi à la minute.
4. **Action pour les appels API externes** (Fapshi, SMS provider) — les actions ont 10 minutes, les mutations 1 seconde. `initiateDirectPay` est déjà une action → bon pattern.

---

## Règle 7 : Pattern auth côté serveur

### Ce qui est déjà correct
- `convex/lib/auth_helpers.ts` : `requireAuth` et `requireAdmin` utilisent `ctx.auth.getUserIdentity()`.
- `AGENTS.md` : "Never trust client-provided userId — use ctx.auth.getUserIdentity() server-side."

### Règles pour la refonte

1. **Toute mutation/query wallet utilise `requireAuth`** — l'utilisateur courant est déduit de l'identity, jamais passé en argument.
2. **Admin vérifié côté serveur** : `requireAdmin` lit `users.isAdmin` depuis la DB (pas depuis un flag client). Actuellement, admin est déduit de `email.endsWith('@numzero.com')` — à garder ou remplacer par un champ `role` typé.
3. **Wallet scope** : `getWalletBalance` et `listLedgerEntries` utilisent `requireAuth()` puis cherchent le wallet par `identity.subject` — pas de paramètre `userId`.
4. **Escrow scope** : `releaseEscrow` et `refundEscrow` vérifient que `escrow.userId === user._id`.
5. **Admin scope** : `listAllWallets`, `listAllOrders`, etc. utilisent `requireAdmin()`.
6. **Convex Auth** : Si le projet utilise BetterAuth (actuel), conserver ce provider. Les règles d'identity (`tokenIdentifier`, `subject`) sont les mêmes quelle que soit la couche auth.

### Attention — auth dans les actions
Les actions Convex n'ont PAS accès à `ctx.auth.getUserIdentity()`. Actuellement, `initiateDirectPay` est une action et passe `userId` manuellement. Dans la refonte :
- Garder le pattern action pour les appels API externes
- MAIS le `userId` doit être passé via `ctx.runMutation` qui aura le contexte auth, OU l'action doit recevoir un token vérifié côté serveur
- Solution recommandée : l'action appelle une `internalMutation` qui reçoit le `userId` en argument (vérifié par la mutation qui schedule l'action)

---

## Règle 8 : Risques performance ledger identifiés

### Risque 1 — Hot read sur `wallets.balanceCents`
- **Signal** : `getUserBalance` (actuellement `api.users.getUserBalance`) est appelée depuis `useBalance()` sur quasiment toutes les pages (wallet, my-space, recharge, nav).
- **Symptôme potentiel** : Le document wallet est lu par de multiples subscriptions réactives. Si le wallet est aussi fréquemment mis à jour (recharge, escrow), les subscriptions se ré-exécutent souvent.
- **Solution** : 
  - Pour l'affichage header/nav : point-in-time read (`ConvexHttpClient.query()`) au lieu de `useQuery`. La balance n'a pas besoin d'être réactive en temps réel.
  - Pour la page wallet : `useQuery` OK car l'utilisateur attend des données fraîches.
  - Garder `balanceCents` sur le document wallet (pas de digest table séparée) car le document est petit (~200 bytes) et l'index est ciblé.

### Risque 2 — OCC conflict sur `wallets` en écriture
- **Signal** : Si un utilisateur fait une recharge (écrit wallet) ET qu'une activation démarre (écrit wallet) simultanément.
- **Symptôme** : OCC conflict → retry de mutation → latence.
- **Solution** : Convex gère le retry automatiquement. À surveiller via `npx convex insights --details`. Si le conflit devient fréquent, envisager un sharding par opération (une mutation = un seul wallet touché). Dans le cas nominal (un seul utilisateur, peu d'opérations concurrentes), le risque est faible.

### Risque 3 — Croissance unbounded de `wallet_ledger_entries`
- **Signal** : Un utilisateur avec des centaines d'opérations.
- **Symptôme** : `getLedgerEntries()` sans pagination dépasse 32000 docs scannés.
- **Solution** : Toujours paginer avec `.take(BATCH_SIZE)`. Ne jamais exposer de `.collect()`. Utiliser un index `by_wallet` avec `order("desc")` pour les queries les plus récentes.

### Risque 4 — Hot document sur `promoCodes.usedCount`
- **Signal** : Si un code promo est utilisé par 1000 utilisateurs simultanément, `promoCodes` devient un hot document en écriture.
- **Symptôme** : OCC conflicts sur le document promo.
- **Solution** : 
  - Option A : Supprimer `usedCount` et le calculer par `count(payment_intents where promoCode=X)`. Cela transforme une hot write en une cold read (COUNT = cher, mais pas d'écriture).
  - Option B : Garder `usedCount` mais le décrémenter dans une `internalMutation` schedulée après la création du `payment_intent` (pas dans la mutation critique).
  - Recommandation : Option A — plus simple, pas de hot write.

### Risque 5 — Subscription invalidation sur les listes admin
- **Signal** : `useAdminWallets` et `useAdminOrders` avec `useQuery` créent des subscriptions sur TOUS les wallets/orders.
- **Symptôme** : Chaque nouveau wallet ou order invalide les requêtes admin de tous les admins connectés.
- **Solution** :
  - Point-in-time read pour les pages admin (rafraîchissement manuel ou périodique).
  - `ConvexHttpClient.query()` dans `useAdminWallets` au lieu de `useQuery`.
  - Si la réactivité admin est vraiment nécessaire, utiliser un digest table (aggrégats par jour/heure).

### Risque 6 — Taux de conversion XAF/USD
- **Signal** : Actuellement `XAF_RATE = 600` hardcodé dans `purchases.ts`, `users.ts`, `step-topup.tsx`, `my-space/constants.ts`.
- **Symptôme** : Si le taux change, toutes les conversions sont fausses.
- **Solution** :
  - Stocker le taux dans une table `exchangeRates` ou via une config Convex.
  - Toutes les conversions passent par une fonction centrale `convertXafToUsdCents(xaf: number): number`.
  - Le frontend ne fait plus de conversion — le backend renvoie toujours les montants en USD cents.

---

## Règle 9 : Architecture provider de paiement — Découpler Fapshi

### Legacy (couplage fort)
```ts
// purchases.ts:initiateDirectPay
const { data } = await fapshiPost('/initiate-pay', { amount, userId, externalId, redirectUrl })
```

### Cible — Gateway abstraction

Ajouter un champ `payment_intents.gateway: string` qui stocke le provider utilisé.

```
payment_intents.create
  → selon gateway:
    "fapshi": fapshiCreatePayment(amountCents, idempotencyKey)
    "stripe": stripeCreatePaymentIntent(amountCents, idempotencyKey)
    etc.
```

Le webhook HTTP n'est plus `/fapshi-webhook` mais `/payment-webhook` avec dispatch basé sur `gateway`:
- Fapshi → `handleFapshiWebhook`
- Stripe → `handleStripeWebhook`
- etc.

Chaque handler de provider :
1. Vérifie la signature/signature du webhook
2. Cherche `payment_intent` par `gatewayTransactionId`
3. Appelle `confirmPaymentIntent(paymentIntentId)` — mutation idempotente qui update le statut + crée l'ordre + crédite le wallet

---

## Règle 10 : Vérification — Checklist intégrité ledger

À intégrer comme vérification post-déploiement :

1. **Intégrité wallet** : `wallet_ledger_entries` group by walletId, sum(amountCents) == wallets.balanceCents
2. **Pas d'escrow orphelin** : tout `escrows(status=held)` a une activation active associée
3. **Pas de double capture** : pas deux `wallet_ledger_entries` avec le même `idempotencyKey`
4. **Pas d'escrow dans deux états** : pas deux escrows avec le même `activationId` et `status=held`
5. **Balance wallet non négative** : `wallets.balanceCents >= 0` (sauf si le produit le permet)
6. **Somme des escrows(held) + wallets.balance == somme des dépôts** : vérification globale de conservation de valeur

Ces vérifications peuvent être implémentées comme queries admin ou cron jobs.

---

## Résumé des règles clés

| Règle | Priorité | Risque si ignoré |
|---|---|---|
| Montants en cents entiers (pas de float) | Critique | Perte de précision financière |
| Idempotence check-before-write sur chaque table financière | Critique | Doublons de paiement/remboursement |
| Une mutation = toutes les écritures ledger atomiques | Critique | Incohérence wallet si crash à mi-parcours |
| Escrow explicite avec machine à états typée | Haute | Double remboursement / capture illégale |
| Pagination obligatoire sur ledger | Haute | Erreur "over 32000 docs scanned" |
| `requireAuth` côté serveur, jamais de userId client | Haute | Escalade de privilège wallet |
| Taux XAF/USD centralisé et configurable | Haute | Montants erronés si taux change |
| Point-in-time read pour balance (pas reactive) | Moyenne | Surcoût subscription inutile |
| Gateway abstraction pour provider paiement | Moyenne | Couplage à Fapshi |
| Promo `usedCount` calculé par query, pas champ écrit | Moyenne | Hot document OCC conflict |
| Check d'intégrité ledger post-migration | Moyenne | Anomalies non détectées |
