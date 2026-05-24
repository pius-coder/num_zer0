# Plan Auria — Standardisation Complète de la DX

## Objectif

Toutes les fonctions `define*` utilisent le **même pattern builder chainable**. Plus d'objets config, plus de signatures inconsistantes. Le client s'inspire de la DX Convex (args plats, callables).

---

## Partie 1 — Règle Unique : Le Builder Standard

```
defineX("domain.name")
  .optionA(...)       // 0..N options (ordre libre)
  .optionB(...)
  .handler(fn)        // TOUJOURS .handler(fn) à la fin
```

- Le nom est TOUJOURS le premier argument (string)
- Les options sont TOUJOURS chainées (`.option().option()`)
- Le handler est TOUJOURS `.handler(fn)` à la fin
- Si un artefact a un type (query/mutate/action), le type vient juste après le nom

---

## Partie 2 — Inventaire Complet de Tous les Artefacts

### 2.1 — DÉJÀ CONFORMES (builder chainable) — Aucun changement

| Fonction | Signature | Handler |
|----------|-----------|---------|
| `defineOperationFn(name)` | `.query()\|.mutate()\|.action().input(z).entities([]).auth()\|.public()\|.internal().use(...).handler(fn)` | `({ ctx, input, params }) => T` |
| `defineHttpAction(path, method)` | `.auth()\|.public()\|.internal().csrf(bool).handler(fn)` | `(ctx, request) => Response` |
| `defineWorkflow(name)` | `.handler(fn)` | `({ ctx, input, step, sleep }) => T` |
| `defineCommonFn(name)` | `.run(fn)` | `({ ctx, input, params, operation }) => void` |
| `defineCronFn(name)` | `.schedule(cron).handler(fn)` | `(ctx) => Promise<void>` |
| `defineNotificationFn(name)` | `.payload(z).handler(fn)` | `({ ctx, payload }) => void` |

### 2.2 — OBJECT CONFIG (à migrer en builder)

| Fonction | Actuel (objet) | Cible (builder) |
|----------|---------------|-----------------|
| `defineAgent(name, { model, systemPrompt, tools, maxSteps, rag })` | 2e arg = objet | `.model(m).systemPrompt(s).tools(t).maxSteps(n).rag(r).handler(fn)` |
| `defineDbReadFn({ name, input, output, execute })` | 1 seul objet | `defineDbReadFn(name).input(z).output(z).handler(fn)` |
| `defineSearchIndex(name, { fields, filterFields, language })` | 2e arg = objet | `.fields(f).filterFields(ff).language(l).handler(fn)` |
| `defineVectorIndex(name, { vectorField, dimensions, filterFields, indexType })` | 2e arg = objet | `.vectorField(v).dimensions(d).filterFields(ff).indexType(t).handler(fn)` |
| `defineComponent(name, { schema, operations, config })` | 2e arg = objet + factory | `.schema(s).operations(o).config(c).handler()` (à définir) |
| `defineAuraParams({ schema, parsers })` | 1 seul objet, pas de nom | `defineAuraParams("name").schema(z).parsers(p)` |

### 2.3 — CLIENT HOOKS (à migrer)

| Actuel | Cible | Changement |
|--------|-------|------------|
| `useAuraQuery(ref, { input, params, ...opts })` | `useQuery(ref, flatArgs, opts?)` | args plats, plus de `{ input }` |
| `useAuraMutation(ref, opts)` → `{ mutate(args) }` | `useMutation(ref, opts?)` → `(args) => Promise<T>` | callable directe |
| `useAuraPaginatedQuery(ref, input, opts?)` | `usePaginatedQuery(ref, flatArgs, opts?)` | Args plats |
| `useAuraAgentThread(threadId)` | `useAgentThread(threadId)` | Renommer |
| `useAuraAgentStream(threadId)` | `useAgentStream(threadId)` | Renommer |
| `useAuraAgentSend(agentName)` | `useAgentSend(agentName)` | Renommer |
| `useAuraForm(opts)` | `useAuraForm(opts)` | ✅ Inchangé |
| `useAuraParams(def)` | `useAuraParams(def)` | ✅ Inchangé |
| `useAuraStepper(opts)` | `useStepperForm(opts)` | Renommer |
| `useAuraManifest()` | `useAuraManifest()` | ✅ Inchangé |
| `useAuraBroadcast()` | `useBroadcast()` | Renommer (pas de `Aura`) |
| `AuraClientProvider` | `AuraProvider` | Renommer |
| `AuraHydrationBoundary` | `AuraHydrationBoundary` | ✅ Inchangé |
| `AuraGuard` | `AuraGuard` | ✅ Inchangé |
| `callAuraOperation(opts)` | `callAura(opts)` | Renommer |
| `configureAuraClient(config)` | `configureAura(config)` | Renommer |
| `fetchAuraManifest()` | `fetchManifest()` | Renommer |
| `AuraClientError` | `AuraError` (ou garder) | ✅ |

### 2.4 — CONTEXTE (inchangé)

Toutes les propriétés de `ctx` restent identiques :

```typescript
interface AuraContext {
  db, session, user, auth, notify, bump, log, audit
  requestId, source, request, cookies
  storage, scheduler, agent
  runQuery(ref, input), runMutation(ref, input), runAction(ref, input)
  paginate(model, opts), invalidate(target), fetch
}
```

### 2.5 — EXPORTS SERVER (inchangés)

| Export | Usage |
|--------|-------|
| `createAuraHonoApp()` | Crée l'app Hono |
| `createAuraContext(opts)` | Crée le contexte |
| `runAuraOperation(opts)` | Exécute une opération |
| `callAuraServer(opts)` | Appel in-process |
| `runAuraServer(opts)` | Appel in-process avec cache |
| `publishInvalidation(keys)` | Broadcast invalidation |
| `createTrackedPrismaClient(db)` | Entity tracker |
| `createReadOnlyDb(db)` | DB read-only |
| `paginate(model, opts)` | Pagination |
| `encodeCursor(data)`, `decodeCursor(cursor)` | Curseurs |
| `processOutboxEvents()` | Outbox |
| `createAuraScheduler(db)` | Scheduler |
| `runAuraCron(name)` | Cron runner |
| `registerOperation(op)`, `getOperation(name)`, `listOperations()` | Registry |
| `getClientOperationManifest()` | Manifeste |
| `discoverArtifacts()`, `deriveNameFromPath()`, `validateStructure()` | Discovery |
| `defineSearchIndex(name)`, `search(model, opts)` | Full-text search |
| `defineVectorIndex(name)`, `vectorSearch(model, opts)` | Vector search |
| `defineWorkflow(name)`, `startWorkflow()`, `executeWorkflowRun()` | Workflows |
| `defineHttpAction(path, method)`, `runHttpAction()` | HTTP actions |
| `defineDbReadFn(name)`, `defineCronFn(name)`, `defineCommonFn(name)` | Helpers |
| `enforceRateLimit()`, `createAuraLogger()`, `createBumpStore()` | Utilitaires |
| `AuraError`, `AuraClientError`, `successEnvelope`, `errorEnvelope` | Errors |
| `auraQueryKey`, `AuraQueryKey` | Query keys |

### 2.6 — UI COMPONENTS (inchangés)

Tous les composants UI gardent leurs noms actuels (`AuraDataTable`, `AuraForm`, `AuraAuthCard`, etc.)

---

## Partie 3 — Exemples Concrets des Migrations

### 3.1 — Agent : objet → builder

```typescript
// AVANT
export default defineAgent("ai.todo-planner", {
  model: new ChatOpenRouter({ apiKey: "...", model: "gpt-4o-mini" }),
  systemPrompt: "Tu es un assistant...",
  tools: [tool1, tool2],
  maxSteps: 5,
})

// APRÈS — même pattern que defineOperationFn
export default defineAgent("ai.todo-planner")
  .model(new ChatOpenRouter({ apiKey: "...", model: "gpt-4o-mini" }))
  .systemPrompt("Tu es un assistant...")
  .tools([tool1, tool2])
  .maxSteps(5)
  .handler(async ({ ctx, input }) => {
    const thread = await ctx.agent.createThread(ctx.thisAgent, { userId: ctx.user?.id })
    return ctx.agent.generateText(thread, { prompt: input.prompt })
  })
```

### 3.2 — DbReadFn : objet → builder

```typescript
// AVANT
export default defineDbReadFn({
  name: "users.active",
  input: z.object({ days: z.number() }),
  output: z.array(userSchema),
  execute: async ({ db, input }) => {
    return db.$queryRaw`...`
  },
})

// APRÈS
export default defineDbReadFn("users.active")
  .input(z.object({ days: z.number() }))
  .output(z.array(userSchema))
  .handler(async ({ db, input }) => {
    return db.$queryRaw`...`
  })
```

### 3.3 — SearchIndex : objet → builder

```typescript
// AVANT
export default defineSearchIndex("Todo", {
  fields: ["title", "description"],
  filterFields: ["status"],
  language: "french",
})

// APRÈS
export default defineSearchIndex("Todo")
  .fields(["title", "description"])
  .filterFields(["status"])
  .language("french")
  .handler(async ({ ctx, query, filters }) => {
    return ctx.search("Todo", { query, filter: filters })
  })
```

### 3.4 — VectorIndex : objet → builder

```typescript
// AVANT
export default defineVectorIndex("Product", {
  vectorField: "embedding",
  dimensions: 1536,
  indexType: "hnsw",
})

// APRÈS
export default defineVectorIndex("Product")
  .vectorField("embedding")
  .dimensions(1536)
  .indexType("hnsw")
  .handler(async ({ ctx, vector, filters }) => {
    return ctx.vectorSearch("Product", { vector, filter: filters })
  })
```

### 3.5 — Client : args plats + callables

```typescript
// AVANT
const { data } = useAuraQuery(api.todos.list, {
  input: { status: "PENDING" },
  params: { page: "1" },
})
const create = useAuraMutation(api.todos.create)
create.mutate({ title: "..." })

// APRÈS
const data = useQuery(api.todos.list, { status: "PENDING" })
const create = useMutation(api.todos.create)
create({ title: "..." })
```

### 3.6 — Pagination

```typescript
// AVANT
const { items, loadMore } = useAuraPaginatedQuery(api.todos.list, { status: "PENDING" })

// APRÈS
const { items, loadMore } = usePaginatedQuery(api.todos.list, { status: "PENDING" })
```

### 3.7 — Agent hooks

```typescript
// AVANT
const { data: messages } = useAuraAgentThread(threadId)
const { isStreaming, streamingContent } = useAuraAgentStream(threadId)
const send = useAuraAgentSend("ai.todo-planner")

// APRÈS
const { data: messages } = useAgentThread(threadId)
const { isStreaming, streamingContent } = useAgentStream(threadId)
const send = useAgentSend("ai.todo-planner")
```

---

## Partie 4 — Plan d'Implémentation

### Phase 1 — Migrer les 4 fonctions objet en builder

Modifier dans l'ordre :
1. `defineDbReadFn` — le plus simple (input + output + handler)
2. `defineSearchIndex` — fields, filterFields, language, handler
3. `defineVectorIndex` — vectorField, dimensions, filterFields, indexType, handler
4. `defineAgent` — le plus complexe (model, systemPrompt, tools, maxSteps, rag, handler)

### Phase 2 — Client DX

1. Renommer `useAuraQuery` → `useQuery`, args plats
2. Renommer `useAuraMutation` → `useMutation`, callable directe
3. Renommer `useAuraPaginatedQuery` → `usePaginatedQuery`
4. Ajouter `"skip"` support
5. Renommer les hooks agent
6. Renommer `AuraClientProvider` → `AuraProvider`
7. Mettre à jour `client/index.ts`
8. Mettre à jour `app/routes/todos.tsx` (exemple)

### Phase 3 — Nettoyage

1. Retirer les anciens exports (`useAuraQuery`, `useAuraMutation`, etc.)
2. Mettre à jour tous les imports dans l'app
3. Mettre à jour les tests
4. Mettre à jour la documentation
5. Mettre à jour le template create-app
