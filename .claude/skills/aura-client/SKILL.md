---
name: aura-client
description: "Aura client hooks and provider. Use when mounting AuraProvider, calling useQuery/useMutation/usePaginatedQuery, using useStepperForm, AuraGuard, or SSR hydration."
---

# Aura Client

## Provider setup
```tsx
import { AuraProvider } from "@/aura/client";

<AuraProvider config={{ baseUrl: "" }}>
  {children}
</AuraProvider>
```

Wraps `QueryClientProvider` + `NuqsAdapter` + realtime subscriptions.

## useQuery(ref, input?, options?)
```tsx
import { useQuery, usePaginatedQuery } from "@/aura/client";
import { api } from "@/aura/_generated/api";

// Typed ref (recommended) or string name
const { data, isLoading, error } = useQuery(
  api.todos.list,
  { status: "PENDING" },
  { showBumps: true }
);
```

Options: `params`, `showBumps` (default `true`), plus all TanStack `useQuery` options.

## useMutation — two APIs

### Options path (2 args)
```tsx
const update = useMutation(api.todos.update, {
  onSuccess: (data, vars) => { ... },
  onError: (err, vars) => { ... },
  onSettled: (data, err, vars) => { ... },
  invalidate: ["Todo"],  // extra keys to invalidate
  refresh: false,        // router.invalidate() after
  showBumps: true,
});
update.mutate({ id: "123", title: "New" });
```

### Builder path (1 arg)
```tsx
const create = useMutation(api.todos.create)
  .onSuccess((data, vars) => { ... })
  .onError((err, vars) => { ... })
  .onSettled((data, err, vars) => { ... });
await create({ title: "New" });
```

Both expose: `mutate`, `mutateAsync`, `isPending`, `isSuccess`, `isError`, `error`, `data`, `status`, `reset`, `variables`, `failureCount`.

## usePaginatedQuery
```tsx
const { items, isLoading, isDone, isFetchingNextPage, loadMore } = usePaginatedQuery(
  api.todos.list,
  { status: "PENDING" },
  { numItems: 20 }
);
```
Returns `{ items: T[], isDone: boolean, isLoading, isFetchingNextPage, loadMore, error, refetch }`.

## AuraGuard (auth guard)
```tsx
import { AuraGuard } from "@/aura/client";

<AuraGuard redirectTo="/login">
  <ProtectedContent />
</AuraGuard>
```
Queries `auth.me` and shows loading/unauthenticated fallbacks.

## useStepperForm
Multi-step form with Zustand persistence, Zod per step, react-hook-form. See `packages/aura/src/client/stepper.ts`.

## Agent hooks
```tsx
import { useAgentThread, useAgentStream, useAgentSend } from "@/aura/client";
```
- `useAgentThread(threadRef)` — polls thread messages
- `useAgentSend(threadRef)` — mutation to send a message
- `useAgentStream(threadRef)` — listens for streaming deltas

## SSR hydration
```ts
import { callAuraServer } from "@/aura/server/call";

const data = await callAuraServer({ operationName: "todos.list" });
```

## Invalidations
Auto-tracked via read/write keys. After mutation, only queries whose **read-keys** match the mutation's **write-keys** are invalidated. No manual `.entities()` needed.

## Source files
- `packages/aura/src/client/hooks.ts` — useQuery, useMutation
- `packages/aura/src/client/provider.tsx` — AuraProvider
- `packages/aura/src/client/paginated-query.ts` — usePaginatedQuery
- `packages/aura/src/client/transport.ts` — HTTP transport
