---
name: aura-operations
description: "Define Aura operations (queries, mutations, actions). Use when calling defineOperationFn, setting input/params schemas, access control, or handling errors."
---

# Aura Operations

## Builder chain
`defineOperationFn("name")` → `.query()` | `.mutate()` | `.action()` → `.input(schema)` → `.params(schema)` → `.use(...commonFns)` → `.auth()` | `.public()` | `.internal()` → `.handler(fn)`

## Real example
```ts
import { defineOperationFn } from "@/aura/server/operation";
import { z } from "zod";

export default defineOperationFn("todos.create")
  .mutate()
  .input(z.object({
    title: z.string().min(1).max(200),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  }))
  .auth()
  .handler(async ({ ctx, input }) => { ... });
```

## Types
- **query**: read-only DB proxy (writes throw)
- **mutate**: full tracked DB (auto-derives read/write keys)
- **action**: no DB — use `ctx.runQuery`/`ctx.runMutation`

## Access
- `.auth()` — `ctx.user`/`ctx.session` guaranteed
- `.public()` — no auth required
- `.internal()` — blocked from bridge (client) calls

## Common functions (middleware)
```ts
const checkOwnership = defineCommonFn("checkOwnership")
  .run(async ({ ctx, input }) => { ... });

defineOperationFn("todos.update")
  .mutate()
  .use(checkOwnership)
  .auth()
  .handler(...)
```

## Nested operations
```ts
const user = await ctx.runQuery("users.get", { id });
await ctx.runMutation("todos.create", { title: "New" });
```

## Error handling
```ts
import { AuraError } from "@/aura/core/errors";
throw new AuraError("NOT_FOUND", "Todo not found");
throw new AuraError("VALIDATION_ERROR", "Invalid", { fieldErrors: { title: ["Required"] } });
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## Bumps (toast notifications)
```ts
ctx.bump.success("Saved!", "Optional description");
ctx.bump.info("Heads up");
ctx.bump.warning("Careful");
ctx.bump.error("Failed", error.message);
```

## Gotchas
- Names must match `^[a-zA-Z][a-zA-Z0-9_.-]*$`
- Every operation needs a type AND access
- Actions: no `ctx.db` — use `runQuery`/`runMutation`
- Import from `@/aura/server/operation` (not `@/aura/server`) for `defineOperationFn`

## Source files
- `packages/aura/src/server/operation.ts` — builder + validation
- `packages/aura/src/core/errors.ts` — AuraError codes
- `apps/app/src/operations/` — real examples
