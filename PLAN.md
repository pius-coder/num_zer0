# Plan Auria — Uniformisation API (inspiré Convex)

## Problème

Le code actuel a **3 patterns** différents pour définir des artefacts :

| Pattern | Exemple | Statut |
|---------|---------|--------|
| Builder chainable | `defineOperationFn("x").query().input(...).entities(...).public().handler(fn)` | ✅ Opérations seulement |
| Objet config | `defineAgent("x", { model, ... })`, `defineDbReadFn({ name, input, ... })` | ❌ Inconsistant |
| Mini-builder | `defineWorkflow("x").handler(fn)`, `defineCommonFn("x").run(fn)` | ⚠️ Pas assez riche |

**Objectif** : TOUTES les fonctions de définition utilisent le même builder pattern, et le client s'inspire de la DX Convex (args plats, mutations callables).

---

## 1. Uniformisation Server — Builder Unique

Tous les artefacts Auria suivent le même pattern :

```
defineXXX("domain.name")
  .optionalConfig()
  .optionalMeta()
  .define(fn)        // ← toujours .define() à la fin
```

### Operations (query/mutation/action)

```typescript
// Current (déjà bon mais renommer .handler → .define)
export const list = defineQuery("todos.list")
  .input(z.object({ status: z.string().optional() }))
  .entities(["Todo"])
  .public()
  .define(async ({ ctx, input }) => {
    return ctx.db.todo.findMany({ where: input.status ? { status: input.status } : undefined })
  })

// Mêmes constructeurs pour mutation / action
export const create = defineMutation("todos.create")
  .input(z.object({ title: z.string().min(1) }))
  .entities(["Todo"])
  .public()
  .define(async ({ ctx, input }) => {
    return ctx.db.todo.create({ data: { title: input.title } })
  })

export const doSomething = defineAction("todos.doSomething")
  .input(z.object({ url: z.string() }))
  .public()
  .define(async ({ ctx, input }) => {
    return ctx.fetch(input.url)
  })
```

Changements :
- `defineOperationFn("x")` → `defineQuery("x")` / `defineMutation("x")` / `defineAction("x")`
- `.handler(fn)` → `.define(fn)` (uniforme avec les autres)
- `.query().input().entities().public().handler()` → `defineQuery().input().entities().public().define()`

### Agent

```typescript
// Avant : defineAgent("x", { model, systemPrompt, tools })
// Après :
export const planner = defineAgent("ai.todo-planner")
  .model(new ChatOpenRouter({ model: "gpt-4o-mini" }))
  .systemPrompt("Tu es un assistant qui décompose des objectifs en tâches.")
  .tools([operationAsTool(api.todos.create, { description: "..." })])
  .maxSteps(5)
  .define()
```

### DbReadFn

```typescript
// Avant : defineDbReadFn({ name, input, output, execute })
// Après :
export const activeUsers = defineDbReadFn("users.active")
  .input(z.object({ days: z.number() }))
  .output(z.array(userSchema))
  .define(async ({ db, input }) => {
    return db.$queryRaw`SELECT * FROM "AuraUser" WHERE ...`
  })
```

### Workflow

```typescript
// Avant : defineWorkflow("x").handler(fn)
// Après :
export const fulfillOrder = defineWorkflow("orders.fulfill")
  .define(async ({ ctx, input, step, sleep }) => {
    const payment = await step("charge-payment", () => ...)
    await step("send-email", () => ...)
  })
```

### Search Index

```typescript
// Avant : defineSearchIndex("model", { fields })
// Après :
export const todoSearch = defineSearchIndex("Todo")
  .fields(["title", "description"])
  .language("french")
  .define()
```

### Vector Index

```typescript
// Avant : defineVectorIndex("model", { vectorField })
// Après :
export const productVector = defineVectorIndex("Product")
  .vectorField("embedding")
  .dimensions(1536)
  .indexType("hnsw")
  .define()
```

### HttpAction

```typescript
// Déjà bon (builder) — juste renommer .handler → .define
export const stripeWebhook = defineHttpAction("/webhook/stripe")
  .method("POST")
  .public()
  .define(async (ctx, request) => {
    return new Response("ok")
  })
```

---

## 2. Client DX — Inspiré Convex

### useQuery — args plats

```typescript
// AVANT :
const { data } = useAuraQuery(api.todos.list, { input: { status: "PENDING" } })

// APRÈS :
const data = useQuery(api.todos.list, { status: "PENDING" })
```

- Plus de `{ input: {...} }` wrapper
- Args passés directement (plats, comme Convex)
- Retourne `undefined` pendant le chargement (plus `{ data, isLoading }`)
- `"skip"` pour désactiver (comme Convex)

### useMutation — callable directe

```typescript
// AVANT :
const create = useAuraMutation(api.todos.create)
create.mutate({ title: "..." })

// APRÈS :
const create = useMutation(api.todos.create)
create({ title: "..." })
```

- `useMutation(ref)` retourne une **fonction async** `(args) => Promise<T>`
- Plus de `.mutate()`, `.isPending`, etc.
- `onSuccess`, `onError`, `invalidate` via options séparées si besoin :
  ```typescript
  const create = useMutation(api.todos.create, {
    onSuccess: (data) => { ... },
    invalidate: ["Todo"],
  })
  ```
  Mais par défaut les entités sont déduites du manifeste (auto-invalidation).

### useAction

```typescript
const doAction = useAction(api.todos.doSomething)
doAction({ url: "..." })
```

Même pattern que `useMutation`.

### Gestion d'état

```typescript
// Loading : data est undefined
const data = useQuery(api.todos.list, params)
if (data === undefined) return <Loading />

// Error : try/catch ou error boundary
// Skip : "skip"
const data = useQuery(api.todos.list, shouldFetch ? params : "skip")
```

---

## 3. Changements Concrets

### Fichiers à modifier

| Fichier | Changement |
|---------|-----------|
| `src/aura/core/types.ts` | Ajouter `defineQuery`/`defineMutation`/`defineAction` types |
| `src/aura/server/operation.ts` | Renommer `defineOperationFn` → `defineQuery`/`defineMutation`/`defineAction`. `.handler(fn)` → `.define(fn)` |
| `src/aura/server/agent.ts` | `defineAgent(name, obj)` → builder chainable |
| `src/aura/server/db-read.ts` | `defineDbReadFn({ object })` → builder chainable |
| `src/aura/server/search.ts` | `defineSearchIndex(name, obj)` → builder chainable |
| `src/aura/server/vector.ts` | `defineVectorIndex(name, obj)` → builder chainable |
| `src/aura/server/workflow.ts` | `defineWorkflow(name).handler(fn)` → builder chainable avec `.define()` |
| `src/aura/server/http-action.ts` | `.handler(fn)` → `.define(fn)` |
| `src/aura/client/hooks.ts` | `useAuraQuery` → `useQuery`. `useAuraMutation` → `useMutation`. Args plats. Callables. |
| `src/aura/client/index.ts` | Mettre à jour les exports |
| `src/operations/**/*.operation.ts` | Migrer toutes les ops vers `defineQuery`/`defineMutation`/`defineAction` |
| `src/operations/ai/todo-planner.agent.ts` | Migrer vers builder chainable |
| `src/aura/_generated/api.ts` | Ajuster la codegen pour les nouveaux noms |

### Nouveaux fichiers

```
src/aura/server/
  define-query.ts       // defineQuery() builder
  define-mutation.ts    // defineMutation() builder  
  define-action.ts      // defineAction() builder
  define-agent.ts       // defineAgent() builder (extrait de agent.ts)
  define-db-read.ts     // defineDbReadFn() builder (extrait de db-read.ts)
  define-search.ts      // defineSearchIndex() builder
  define-vector.ts      // defineVectorIndex() builder
  define-workflow.ts    // defineWorkflow() builder
```

Ou tout garder dans les fichiers existants, juste changer les signatures.

---

## 4. Plan d'Implémentation

### Phase 1 — Nouveaux constructeurs server
- Créer `defineQuery` / `defineMutation` / `defineAction` (wrap `defineOperationFn`)
- Ajouter `.define()` comme alias de `.handler()`
- Migrer toutes les ops existantes

### Phase 2 — Builder uniforme pour les autres fonctions
- `defineAgent` : passer d'objet à builder
- `defineDbReadFn` : idem
- `defineSearchIndex` : idem
- `defineVectorIndex` : idem
- `defineWorkflow` : ajouter `.define()`

### Phase 3 — Nouveau client DX
- `useQuery(ref, flatArgs)` au lieu de `useAuraQuery(ref, { input })`
- `useMutation(ref)` → `(args) => Promise<T>` au lieu de `{ mutate }`
- `useAction(ref)` → `(args) => Promise<T>`
- Option `"skip"` pour désactiver les queries
- Auto-invalidation via entités du manifeste

### Phase 4 — Nettoyage
- Retirer les anciens exports (`useAuraQuery`, `useAuraMutation`, `defineOperationFn`)
- Mettre à jour la codegen
- Mettre à jour les tests
