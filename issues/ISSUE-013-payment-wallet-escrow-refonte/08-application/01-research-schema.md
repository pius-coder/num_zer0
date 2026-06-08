# Research: Convex Schema — Payment/Wallet/Escrow Step 1

**Date:** 2026-06-08
**Objectif:** Préparer l'implémentation du Step 1 (ajout 6 tables) du plan ISSUE-013

---

## 1. Sources Consultées

| Source | URL | Contenu clé |
|--------|-----|-------------|
| Schemas | https://docs.convex.dev/database/schemas | `defineSchema`, `defineTable`, `v.id()`, `v.union()`, `v.optional()`, circular refs, `schemaValidation`, `strictTableNameTypes` |
| Indexes | https://docs.convex.dev/database/reading-data/indexes/ | `.index(name, fields)`, compound indexes, staged indexes, limits (32/table, 16 fields), naming convention `by_field1_field2` |
| TableDefinition API | https://docs.convex.dev/api/classes/server.TableDefinition | `.index()`, `.searchIndex()`, `.vectorIndex()` API complète |
| Validators (v) | https://docs.convex.dev/api/modules/validator | Tous les types : `v.id(tableName)`, `v.string()`, `v.number()`, `v.boolean()`, `v.union()`, `v.literal()`, `v.optional()`, `v.object()`, `v.array()`, `v.record()`, `v.null()`, `v.any()`, `v.bytes()`, `v.int64()` |
| VId class | https://docs.convex.dev/api/classes/values.VId | `v.id("tableName")` — référence typée à une autre table |
| VUnion class | https://docs.convex.dev/api/classes/values.VUnion | `v.union(members)` — union de validateurs |
| Types cookbook | https://stack.convex.dev/types-cookbook | Export field validators, `Infer<T>`, `Doc<"table">`, `schema.tables.recipes.validator` |
| Document IDs/Relations | https://docs.convex.dev/database/document-ids | `v.id("tableName")` pour références inter-tables |
| Relationship Structures | https://stack.convex.dev/relationship-structures-let-s-talk-about-schemas | One-to-many, many-to-many patterns, association tables |
| Relational Data | https://www.convex.dev/can-do/relational-data | Document IDs as references |
| Migrations primer | https://stack.convex.dev/intro-to-migrations | Ajouter tables = backward compatible, `v.optional()` pour deprecated, ne pas supprimer directement |
| Migrations component | https://stack.convex.dev/migrating-data-with-mutations | widen → migrate → narrow, `@convex-dev/migrations` |
| @convex-dev/migrations | https://github.com/get-convex/migrations | `migrations.define({ table, migrateOne })` |
| Zero-downtime migrations | https://stack.convex.dev/zero-downtime-migrations | Vidéo démo migrations Convex |
| Limits | https://docs.convex.dev/production/state/limits | 10,000 tables max, 32 indexes/table, 16 fields/index, 1 MiB/doc, 1024 fields/doc, 8192 array elements, 16 nesting depth |
| Best practices | https://docs.convex.dev/understanding/best-practices | Redundant indexes, filter vs withIndex, pagination |
| Queries that scale | https://stack.convex.dev/queries-that-scale | Index perf, avoid hot documents, split frequently-updated fields |
| Source code schema.ts | https://github.com/get-convex/convex-js/blob/main/src/server/schema.ts | `defineSchema`, `DefineSchemaOptions` |
| Source code validator.ts | https://github.com/get-convex/convex-js/blob/main/src/values/validator.ts | `v.id()`, `v.union()`, `v.optional()`, `v.object()` implementations |
| Convex core skill | https://github.com/Geolize/convex-skills/blob/main/skills/convex-core/SKILL.md | Index rules, query patterns, schema conventions |

---

## 2. Règles Convex pour Schema

### 2.1 Ce qui marche

| Règle | Détail |
|-------|--------|
| **Ajouter des tables** | `defineSchema({ ...existingTables, newTable: defineTable({...}) })` — backward compatible. Les tables existantes ne sont pas affectées. |
| **Ajouter des indexes** | `.index("by_field", ["field"])` sur n'importe quelle table existante. Le premier déploiement sera plus lent (backfill). |
| **`v.id("tableName")`** | Crée une référence typée vers une autre table. Fonctionne même si la table référencée est définie APRÈS dans `defineSchema`. Le nom de table est une string, pas une variable. |
| **`v.union(v.literal('a'), v.literal('b'))`** | Union de literals pour les statuts typés. Pattern standard Convex pour les enums. |
| **`v.optional(v.number())`** | Rend un champ optionnel. Les documents existants sans ce champ passent la validation. Utilisé pour déprécier des champs. |
| **`v.optional(v.object({...}))`** | Objet optionnel. Les champs internes peuvent aussi être optionnels. |
| **Index composés** | `.index("by_field1_field2", ["field1", "field2"])` — jusqu'à 16 fields. `_creationTime` ajouté automatiquement à la fin. |
| **Nommage indexes** | Convention officielle : `by_field1_field2` (inclure tous les champs dans le nom). Ex: `"by_userId_status"`. |
| **`strictTableNameTypes: true`** (défaut) | TypeScript interdit l'accès aux tables non déclarées dans le schéma. |
| **`schemaValidation: true`** (défaut) | Convex valide tous les documents à chaque insert/patch/replace. |

### 2.2 Ce qui ne marche PAS

| Règle | Détail |
|-------|--------|
| **`v.id()` sans tableName** | `v.id()` doit toujours avoir un argument string `v.id("users")`. `v.id` seul est un type, pas un validateur. |
| **Index sur `_creationTime`** | Impossible d'ajouter `_creationTime` dans un index. Il est automatiquement ajouté à la fin de tous les indexes. |
| **Index nommé `by_creation_time`** | Réservé par Convex. Ne pas créer. |
| **Index nommé `by_id`** | Réservé par Convex. Ne pas créer. |
| **Index avec `staged: true` utilisable** | Un index staged ne peut PAS être utilisé dans les queries tant qu'il n'est pas activé (retirer `staged`). |
| **Champs commençant par `_`** | Réservés pour les system fields (`_id`, `_creationTime`). Interdit dans les définitions utilisateur. |
| **Champs commençant par `$`** | Réservés Convex. Interdit. |
| **Supprimer un champ non-optional** | Convex rejette le déploiement si des documents existants ont encore le champ. D'abord `v.optional()`, puis migration pour supprimer les données, puis suppression. |
| **`v.undefined()`** | N'existe pas. Utiliser `v.optional()` pour les champs qui peuvent être absents. |
| **Array index** | Impossible d'indexer un `v.array()`. Les arrays ne peuvent pas être utilisés dans `.index()`. |

### 2.3 Limitations Convex

| Limite | Valeur | Implication pour Step 1 |
|--------|--------|------------------------|
| Tables max | 10,000 | Actuelles: 9. Après Step 1: 15. Aucun risque. |
| Indexes par table | 32 | Chaque nouvelle table a 2-4 indexes. Aucun risque. |
| Fields par index | 16 | Tous nos indexes ont 1-2 fields. Confortable. |
| Taille document | 1 MiB | Aucun champ n'approche cette limite. |
| Fields par document | 1,024 | Nos tables ont 5-15 fields. Confortable. |
| Array elements | 8,192 | `metadata` object optionnel, pas un array. |
| Nesting depth | 16 | `metadata` a 1-2 niveaux. Confortable. |
| Index name length | 64 chars | `by_walletId_createdAt` = 21 chars. OK. |

---

## 3. Pattern du Projet (schema.ts existant)

### 3.1 Structure globale

Fichier: `/home/ubuntu/num_zer0/convex/schema.ts` (135 lignes)

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAnonymous: v.boolean(),
    hasMadeDeposit: v.optional(v.boolean()),   // déjà optional
    // ...
    balanceUsd: v.optional(v.number()),          // déjà optional
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_betterAuthUserId', ['betterAuthUserId'])
    .index('by_email', ['email']),
  // ... 8 autres tables
})
```

### 3.2 Conventions de nommage identifiées

| Élément | Pattern | Exemple |
|---------|---------|---------|
| Index nom simple | `by_<field>` | `by_userId`, `by_slug`, `by_code` |
| Index composé | `by_<field1>_<field2>` | `by_country_service`, `by_userId_status` |
| Index par référence | `by_<referencedTable>` | `by_piece` (pour `pieceId`) |
| Noms de tables | `snake_case` pluriel | `activations`, `analytics_events`, `promoCodes` (camelCase legacy) |
| Champs timestamp | `createdAt`, `updatedAt` | `v.number()` |
| Relations | `v.id('tableName')` pour références fortes | `pieceId: v.id('pieces')` à la ligne 87 |
| Relations faibles | `v.string()` pour userIds externes | `userId: v.string()` (BetterAuth ID, pas `v.id('users')`) |
| Status typés | `v.union(v.literal(...))` | `activations.status` (lignes 107-116) |
| Champs optionnels | `v.optional(v.string())` | Partout dans le schéma |
| Index en chaîne | `.index(...).index(...)` | Jusqu'à 4 indexes par table |

### 3.3 Pattern important: userId en `v.string()`, pas `v.id('users')`

Toutes les tables utilisent `userId: v.string()` pour référencer les utilisateurs. C'est parce que les IDs utilisateur sont des `betterAuthUserId` (strings externes), pas des `_id` Convex.

**Conséquence pour Step 1:** Les nouvelles tables (`wallets`, `payment_intents`, `escrows`, `orders`) doivent utiliser `userId: v.string()` pour rester cohérentes avec le pattern existant.

### 3.4 Pattern `v.id()` utilisé uniquement pour les tables Convex

`v.id()` est utilisé uniquement pour référencer d'autres tables Convex:
- `pieceId: v.id('pieces')` (ligne 81)
- `activationId: v.id('activations')` (proposé dans la plan)

Les références `v.id('activations')` fonctionnent car la table `activations` est déclarée dans le même `defineSchema`.

### 3.5 Ordre des tables dans defineSchema

L'ordre actuel est: `users → analytics_events → packages → purchases → promoCodes → comptes → pieces → lignes → marginOverrides → activations`

Convex ne nécessite pas d'ordre spécifique — `v.id('pieces')` fonctionne même si `activations` est défini après. Mais par convention, le projet suit un ordre logique (users d'abord).

---

## 4. Plan d'Implémentation Concret pour Step 1

### 4.1 Code exact à ajouter dans `convex/schema.ts`

Ajouter APRÈS la table `activations` (ligne 135) et AVANT la fermeture de `defineSchema`):

```ts
  wallets: defineTable({
    userId: v.string(),
    balanceCents: v.number(),
    currency: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId']),

  wallet_ledger_entries: defineTable({
    walletId: v.id('wallets'),
    type: v.union(
      v.literal('credit'),
      v.literal('debit'),
      v.literal('release'),
      v.literal('refund'),
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
    .index('by_reference', ['referenceType', 'referenceId']),

  payment_intents: defineTable({
    userId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('succeeded'),
      v.literal('failed'),
      v.literal('cancelled'),
      v.literal('expired'),
    ),
    gateway: v.string(),
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
    .index('by_status', ['status']),

  escrows: defineTable({
    userId: v.string(),
    activationId: v.id('activations'),
    amountCents: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('held'),
      v.literal('released'),
      v.literal('refunded'),
      v.literal('partial_released'),
    ),
    providerCostCents: v.optional(v.number()),
    marginCents: v.optional(v.number()),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_activationId', ['activationId'])
    .index('by_status', ['status']),

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
    .index('by_type', ['type']),

  provider_operations: defineTable({
    provider: v.string(),
    operation: v.string(),
    request: v.string(),
    response: v.string(),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
    ),
    referenceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_referenceId', ['referenceId'])
    .index('by_provider_operation', ['provider', 'operation']),
```

### 4.2 Marquage `users.balanceUsd` et `users.hasMadeDeposit` en `v.optional()`

**État actuel** (lignes 10, 15 du schema.ts):
```ts
hasMadeDeposit: v.optional(v.boolean()),   // déjà optional ✓
balanceUsd: v.optional(v.number()),         // déjà optional ✓
```

Ces deux champs sont DÉJÀ en `v.optional()` dans le schéma existant. Aucune modification nécessaire pour Step 1.

**Vérification de compatibilité** (rechercher les écritures):
- `convex/auth.ts` — vérifier si `balanceUsd` est écrit dans `syncUser`
- `convex/users.ts` — vérifier si `balanceUsd` est initialisé
- `convex/sms_provider.ts` — vérifier si `hasMadeDeposit` est patché

Si des écritures existent, elles doivent continuer de fonctionner car `v.optional()` accepte les valeurs définies ET `undefined`.

### 4.3 Ordre des validateurs dans defineSchema

L'ordre proposé (par convention du projet, logique métier puis alphabétique):

```
users (existant)
analytics_events (existant)
packages (existant)
purchases (existant)
promoCodes (existant)
comptes (existant)
pieces (existant)
lignes (existant)
marginOverrides (existant)
activations (existant)
--- nouvelles tables ajoutées ici ---
wallets                  # dépend de: rien (userId string)
wallet_ledger_entries    # dépend de: wallets (v.id)
payment_intents          # dépend de: rien (userId string)
escrows                  # dépend de: activations (v.id)
orders                   # dépend de: payment_intents, escrows (v.id optionnel)
provider_operations      # dépend de: rien
```

**Note:** `v.id('wallets')` dans `wallet_ledger_entries` fonctionne car `wallets` est défini AVANT dans le même `defineSchema`. Idem pour `escrows.activationId: v.id('activations')` et `orders.paymentIntentId: v.id('payment_intents')`.

### 4.4 Vérifications avant déploiement

```bash
# 1. TypeScript check
npx convex codegen    # génère les types pour les nouvelles tables
npx tsc --noEmit      # vérifie que tout typecheck

# 2. Lint
npm run lint          # vérifie max-lines (200), etc.

# 3. Deploy (dry-run d'abord)
npx convex deploy     # ajoute les tables, backfill des indexes
```

**Ce que `npx convex deploy` fait:**
1. Ajoute les 6 nouvelles tables avec leurs validateurs
2. Crée les indexes (backfill synchrone — peut être lent si les tables ont déjà des données, mais ce sont des tables vides)
3. Ne touche PAS aux tables existantes
4. Valide que tous les documents existants correspondent toujours au schéma (les `v.optional()` déjà présents assurent la compatibilité)

**Risque:** Aucun. L'ajout de tables et d'indexes est toujours backward compatible.

### 4.5 Vérifications post-déploiement

| Vérification | Commande |
|-------------|----------|
| Tables créées | Dashboard Convex → Data → voir `wallets`, `wallet_ledger_entries`, `payment_intents`, `escrows`, `orders`, `provider_operations` |
| Indexes créés | Dashboard Convex → Data → chaque table → Indexes |
| Types générés | `convex/_generated/dataModel.d.ts` doit contenir les nouveaux types `Doc<"wallets">`, etc. |
| Déploiement réussi | `npx convex deploy` exit code 0 |

---

## 5. Décisions Architecturales pour Step 1

### 5.1 `userId: v.string()` vs `userId: v.id('users')`

**Décision:** `v.string()` — pattern existant du projet.

Justification: Les utilisateurs sont identifiés par `betterAuthUserId` (string externe), pas par `_id` Convex. Toutes les tables existantes utilisent `userId: v.string()`. La cohérence prime.

Exception: `escrows.activationId: v.id('activations')` — car `activations` est une table Convex avec des `_id` Convex.

### 5.2 Montants en cents entiers

**Décision:** Tous les montants sont en `v.number()` représentant des **cents** (pas de flottants).

- `balanceCents: v.number()` — solde du wallet en cents USD
- `amountCents: v.number()` — montant partout
- Plus de `priceXaf` flottant ni de conversion ambiguë

### 5.3 Timestamps en `v.number()`

**Décision:** `createdAt` et `updatedAt` en `v.number()` (millisecondes epoch). Pattern existant du projet.

### 5.4 Status en `v.union(v.literal(...))`

**Décision:** Tous les status sont typés avec des unions de literals. Pattern existant (inspiré de `activations.status` lignes 107-116).

### 5.5 Index composés pour queries fréquentes

**Décision stratégique sur les indexes:**

| Index | Pourquoi |
|-------|----------|
| `wallet_ledger_entries.by_walletId_createdAt` | Pagination chronologique du ledger |
| `wallet_ledger_entries.by_reference` | Retrouver toutes les entrées liées à un payment_intent/escrow |
| `payment_intents.by_idempotencyKey` | Guard d'idempotence |
| `payment_intents.by_gatewayTransactionId` | Lookup par transaction Fapshi |
| `provider_operations.by_provider_operation` | Filtrer par provider + type d'opération |
| `escrows.by_activationId` | Lookup escrow → activation |

**Note sur les indexes redondants:** L'index `by_userId` sur `wallet_ledger_entries` n'est PAS nécessaire car `by_walletId` via le wallet lookup est suffisant. Pas d'index `by_userId_status` sur `escrows` tant que les volumes restent faibles.

---

## 6. Migration Plan (pour référence Step 16-17)

Bien que Step 1 soit purement l'ajout de schéma, voici comment les migrations futures s'intégreront:

1. **Step 1** (ce step): Ajouter les 6 tables + indexes. `npx convex deploy`.
2. **Steps 4-7**: Créer les modules backend (écrivent dans les nouvelles tables uniquement).
3. **Step 16**: Migration `@convex-dev/migrations` des escrows actifs depuis `pieces/lignes`.
4. **Step 17**: Migration wallets, ledger entries, payment_intents, orders depuis `comptes/pieces/lignes/purchases`.
5. **Step 21**: Supprimer les tables legacy + `users.balanceUsd`/`users.hasMadeDeposit` du schéma.

La migration widen → migrate → narrow est respectée:
- **Widen** (Step 1): Ajout des tables, champs optionnels
- **Migrate** (Steps 16-17): Backfill des données
- **Narrow** (Step 21): Suppression des anciens champs/tables
