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

### Operations (query/mutation/action) — INCHANGÉ

```typescript
// On garde EXACTEMENT notre pattern actuel
export default defineOperationFn("todos.list")
  .query()
  .input(z.object({ status: z.string().optional() }))
  .entities(["Todo"])
  .public()
  .handler(async ({ ctx, input }) => {
    return ctx.db.todo.findMany({ where: input.status ? { status: input.status } : undefined })
  })
```

Le builder `defineOperationFn("x").query()|.mutate()|.action()` reste. Pas de `defineQuery`/`defineMutation`/`defineAction` séparés.

### Agent

```typescript
// Avant : defineAgent("x", { model, systemPrompt, tools })  ← objet
// Après : même pattern que les opérations (builder chainable)
export default defineAgent("ai.todo-planner")
  .model(new ChatOpenRouter({ model: "gpt-4o-mini" }))
  .systemPrompt("Tu es un assistant qui décompose des objectifs en tâches.")
  .tools([operationAsTool(api.todos.create, { description: "..." })])
  .maxSteps(5)
  .handler(async ({ ctx, input }) => {
    // ...
  })
```

### DbReadFn

```typescript
// Avant : defineDbReadFn({ name, input, output, execute })  ← objet
// Après : builder chainable
export default defineDbReadFn("users.active")
  .input(z.object({ days: z.number() }))
  .output(z.array(userSchema))
  .handler(async ({ db, input }) => {
    return db.$queryRaw`SELECT * FROM "AuraUser" WHERE ...`
  })
```

### Workflow

```typescript
// Avant : defineWorkflow("x").handler(fn)  ← pas de .define()
// Après : builder avec plus de config
export default defineWorkflow("orders.fulfill")
  .handler(async ({ ctx, input, step, sleep }) => {
    const payment = await step("charge-payment", () => ...)
    await step("send-email", () => ...)
  })
```

### Search Index

```typescript
// Avant : defineSearchIndex("model", { fields })  ← objet
// Après : builder chainable
export default defineSearchIndex("Todo")
  .fields(["title", "description"])
  .language("french")
  .handler(async ({ ctx, query }) => {
    return ctx.search("Todo", { query })
  })
```

### Vector Index

```typescript
// Avant : defineVectorIndex("model", { vectorField })  ← objet
// Après : builder chainable
export default defineVectorIndex("Product")
  .vectorField("embedding")
  .dimensions(1536)
  .indexType("hnsw")
  .handler(async ({ ctx, vector }) => {
    return ctx.vectorSearch("Product", { vector })
  })
```

### HttpAction

```typescript
// Déjà bon (builder) — rien à changer
export default defineHttpAction("/webhook/stripe")
  .method("POST")
  .public()
  .handler(async (ctx, request) => {
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
| `src/aura/server/agent.ts` | `defineAgent(name, obj)` → builder chainable `.model().systemPrompt().tools().handler()` |
| `src/aura/server/db-read.ts` | `defineDbReadFn({ object })` → builder chainable `.input().output().handler()` |
| `src/aura/server/search.ts` | `defineSearchIndex(name, obj)` → builder chainable `.fields().language().handler()` |
| `src/aura/server/vector.ts` | `defineVectorIndex(name, obj)` → builder chainable `.vectorField().dimensions().indexType().handler()` |
| `src/aura/client/hooks.ts` | `useAuraQuery` → `useQuery`. `useAuraMutation` → `useMutation`. Args plats. Callables. |
| `src/aura/client/index.ts` | Mettre à jour les exports |
| `src/operations/ai/todo-planner.agent.ts` | Migrer vers builder chainable |
| `src/aura/_generated/api.ts` | Rien (le pattern d'export ne change pas) |

### Rien à changer

| Fichier | Raison |
|---------|--------|
| `src/aura/server/operation.ts` | `defineOperationFn` reste exactement comme il est |
| `src/aura/server/workflow.ts` | Déjà un builder, juste retoucher |
| `src/aura/server/http-action.ts` | Déjà un builder, rien à faire |
| `src/operations/**/*.operation.ts` | Le pattern `defineOperationFn("x").query().input().handler()` ne change pas |

---

## 4. Plan d'Implémentation

### Phase 1 — Builder uniforme pour defineAgent, defineDbReadFn, defineSearchIndex, defineVectorIndex
- `defineAgent` : passer d'objet `(name, { model, ... })` à builder `.model().systemPrompt().tools().handler()`
- `defineDbReadFn` : idem, objet → builder `.input().output().handler()`
- `defineSearchIndex` : idem
- `defineVectorIndex` : idem
- Rien ne change pour `defineOperationFn`, `defineWorkflow`, `defineHttpAction` (déjà des builders)

### Phase 2 — Client DX (inspiré Convex)
- `useQuery(ref, flatArgs)` au lieu de `useAuraQuery(ref, { input })`
- `useMutation(ref)` → `(args) => Promise<T>` au lieu de `{ mutate }`
- `useAction(ref)` → `(args) => Promise<T>`
- Option `"skip"` pour désactiver les queries
- Auto-invalidation via entités du manifeste (déjà existant)

### Phase 3 — Nettoyage
- Retirer les anciens exports (`useAuraQuery`, `useAuraMutation`)
- Mettre à jour les tests
