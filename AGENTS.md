# num_zer0 — Agent Guide

## Skills

All skills live in `.agents/skills/`. Load the relevant one before working in each area:

- `.agents/skills/tanstack-integration-best-practices/SKILL.md` — Router + Query + Start integration
- `.agents/skills/tanstack-query-best-practices/SKILL.md` — React Query caching, mutations, optimistic updates
- `.agents/skills/tanstack-router-best-practices/SKILL.md` — Route setup, loaders, navigation
- `.agents/skills/tanstack-start-best-practices/SKILL.md` — Server functions, SSR, auth, middleware
- `.agents/skills/convex-migration-helper/SKILL.md` — Convex schema migration planning
- `.agents/skills/convex-performance-audit/SKILL.md` — Convex read/write performance
- `.agents/skills/convex-setup-auth/SKILL.md` — Convex auth and identity

## Project Structure

```
src/
├── common/              # Global elements used across the app
│   ├── ui/              # shadcn UI primitives (button, sonner, etc.)
│   ├── provider/        # App-level providers (Convex, etc.)
│   ├── not-found.tsx    # Global 404
│   └── default-catch-boundary.tsx
├── components/          # Feature-scoped code
│   ├── landing/         # Landing page feature
│   ├── todo/            # Todo demo feature
│   └── <feature>/       # Each feature follows the pattern below
├── routes/              # TanStack Router file-based routes
└── lib/                 # Pure utilities (cn, etc.)
```

### Feature Folder Pattern

```
src/components/<feature>/
├── docs/                 # Feature lifecycle docs
│   ├── CHANGELOG.md      # Change history
│   ├── CONTINUE.md       # How to continue working here
│   └── TODOS.md          # Implementation todos
├── hooks/
│   ├── index.ts          # barrel
│   └── use-<feature>.ts  # complex Convex hooks only
├── <sub-component>.tsx   # simple UI inline
└── index.ts              # barrel export
```

**Key rules:**

- Max **200 lines** per file (enforced by ESLint `max-lines`). Ignore blank lines and comments.
- `routeTree.gen.ts` is auto-generated and excluded from the limit.

## Feature Lifecycle

Each feature in `components/` has a **lifecycle** documented in `docs/`:

| File           | Purpose                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `CHANGELOG.md` | Every change to the feature, newest first. Who, what, when, why.                                                     |
| `CONTINUE.md`  | Current state, known issues, next steps, architectural decisions. Anyone can pick up where the last person left off. |
| `TODOS.md`     | Implementation checklist with completion status. Tasks to finish the feature.                                        |

When starting work on a feature:

1. Read `docs/CONTINUE.md` first to understand current state
2. Check `docs/TODOS.md` for pending work
3. Update `docs/CHANGELOG.md` after making changes
4. Update `docs/TODOS.md` as tasks complete

## Hooks vs Inline

**Put in `hooks/`** — complex implementations only:

- Convex mutations wrapped with `useConvexMutation` + `withOptimisticUpdate` + `useMutation`
- Query key/descriptor factories (`todoQueries.list()`) consumed by `@tanstack/react-query`
- Any logic with 3+ steps, optimistic cache manipulation, or rollback

**Keep inline** in the feature sub-component — simple UI:

- Input + button combos, item rows, list sections, title/header blocks
- Components with local state only (form inputs, toggles)
- Pure presentational components

## Convex + React Query Pattern

The app uses `@tanstack/react-query` with `@convex-dev/react-query` integration.

### Query Descriptors

```ts
export const todoQueries = {
  list: () => convexQuery(api.todos.list, {}),
}
```

Consumed in components via `@tanstack/react-query`:

```ts
import { useQuery } from '@tanstack/react-query'

function TodoList() {
  const { data: todos, isLoading } = useQuery(todoQueries.list())
}
```

### Mutation Hooks with Optimistic Updates

All mutations go through `hooks/` files with `withOptimisticUpdate` for instant UI feedback:

```ts
export function useAddTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.add)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(api.todos.list, {}, [
        { _id: `temp_${Date.now()}`, text: args.text, completed: false, ... },
        ...todos,
      ])
    })
  return useMutation({ mutationFn })
}
```

Reference key rules:

- `.agents/skills/tanstack-query-best-practices/rules/mut-optimistic-updates.md`
- `.agents/skills/tanstack-query-best-practices/rules/qk-factory-pattern.md`
- `.agents/skills/tanstack-query-best-practices/rules/mut-invalidate-queries.md`
- `.agents/skills/tanstack-query-best-practices/rules/mut-mutation-state.md`

### Router + Query Integration

- `QueryClient` is created per-request in `router.tsx` and passed through router context
- `setupRouterSsrQueryIntegration` handles SSR hydration automatically
- Router's `defaultPreloadStaleTime: 0` defers caching to React Query (single source of truth)

Reference: `.agents/skills/tanstack-integration-best-practices/rules/setup-query-client-context.md`
Reference: `.agents/skills/tanstack-integration-best-practices/rules/cache-single-source.md`

## Convex Best Practices

Convex is the primary backend. TanStack Query is only a thin layer for reactive mutation wrappers. The following skills cover the full Convex workflow:

### Routing — `convex` skill

Load this first before any other Convex skill: `.agents/skills/convex/SKILL.md`

Routes to the right skill:

- **New project** — `convex-quickstart`
- **Auth setup** — `convex-setup-auth`
- **Reusable component** — `convex-create-component`
- **Schema migration** — `convex-migration-helper`
- **Performance audit** — `convex-performance-audit`

### Quickstart — `convex-quickstart`

- `npx convex dev --once` to provision, push, and typecheck
- `npm run dev` for the full dev loop
- `CONVEX_AGENT_MODE=anonymous` for agent contexts
- Module-level `ConvexReactClient`, not inside components

Reference: `.agents/skills/convex-quickstart/SKILL.md`

### Auth — `convex-setup-auth`

- Never trust client-provided `userId` — use `ctx.auth.getUserIdentity()` server-side
- Choose provider (Convex Auth, Clerk, WorkOS, Auth0) based on repo signals or ask
- Only add `users` table if needed — Convex Auth manages records internally

Reference: `.agents/skills/convex-setup-auth/SKILL.md`

### Components — `convex-create-component`

- Components own isolated tables and expose a small app-facing API
- Auth, env, and HTTP routes stay in the app — components cannot access them
- Parent app IDs cross boundary as `v.string()`, not `v.id()`
- Public component functions need `args` and `returns` validators

Reference: `.agents/skills/convex-create-component/SKILL.md`

### Migrations — `convex-migration-helper`

- Schema changes follow: widen → migrate → narrow
- Use `@convex-dev/migrations` for batched, resumable migrations
- Always dry-run first: `npx convex run migrations:myMigration '{"dryRun": true}'`
- Prefer deprecating fields over deleting

Reference: `.agents/skills/convex-migration-helper/SKILL.md`

### Performance — `convex-performance-audit`

- Start with signals: `npx convex insights --details`, then match problem class
- Hot paths → index, denormalization, digest tables
- OCC conflicts → write contention, hot document splitting
- High subscriptions → point-in-time reads instead of reactive
- Near limits → batch size, document size, execution budget
- Fix sibling functions touching the same tables consistently

Reference: `.agents/skills/convex-performance-audit/SKILL.md`

### General Convex Patterns

```ts
// Schema — define tables with validators
export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
})

// Query — ctx.db.query with index
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('todos').order('desc').collect()
  },
})

// Mutation — ctx.db.insert / patch / delete
export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert('todos', { text: args.text, completed: false })
  },
})

// Auth — verify server-side, never trust client
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error('Not authenticated')
```
