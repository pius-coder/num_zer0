---
name: aura-data
description: "Aura data layer: ctx.db, pagination, reactive tracking. Use when writing operations that access the database, using ctx.paginate, or understanding auto-tracking."
---

# Aura Data

## ctx.db
Full Prisma client available on context:
- **Queries**: wrapped in read-only proxy (writes throw `AuraError`)
- **Mutations**: wrapped in tracked proxy (auto-records read/write keys)
- **Actions**: tombstoned — no DB access, use `runQuery`/`runMutation`

## Pagination
```ts
return ctx.paginate(ctx.db.todo, {
  where: { userId: user.id },
  cursor: input.cursor,     // opaque HMAC-signed string
  take: 20,                 // rows to fetch
  orderBy: "createdAt",
  direction: "desc",
  operationHash: "todos.list", // binds cursor to this operation
});
// Returns { items: Todo[], cursor: string | null, isDone: boolean }
```

Cursors are HMAC-signed and bound to `operationHash` to prevent replay attacks.

## Service pattern
```ts
import { AuraService } from "@/aura/server/service";

class TodoService extends AuraService {
  async list(input: { ... }) {
    const user = this.requireUser(); // via AuraError
    return this.paginate(this.db.todo, { ... });
  }
}
```
Accessors: `this.db`, `this.user`, `this.session`, `this.log`, `this.bump`, `this.audit`, `this.storage`, `this.scheduler`, `this.agent`, `this.notify`, `this.auth`, `this.requestId`, `this.source`.

## Reactive tracking (auto-key derivation)

| Prisma method | Read-keys derived |
|---|---|
| `findUnique({where:{id}})` → hit | `Model:<id>` |
| `findUnique({where:{id}})` → miss | `Model:<id>` |
| `findFirst/findMany` | `Model` + `Model:<id>` per row |
| `count/aggregate/groupBy` | `Model` |

| Prisma method | Write-keys derived |
|---|---|
| `create` | `Model` + `Model:<newId>` |
| `update/upsert/delete({where:{id}})` | `Model` + `Model:<id>` |
| `createMany/updateMany/deleteMany` | `Model` |

Key format: PascalCase model name (`auraUser` → `AuraUser`).

### Matching
`hit = writeKeys.some(k => readKeys.has(k))`:
- Write `Todo` matches any query reading `Todo` or `Todo:<id>`
- Write `Todo:123` matches queries reading `Todo` or `Todo:123`

### Escape hatch
```ts
ctx.track({ read: ["CustomKey"] });
ctx.track({ write: ["Todo"] });
```
For `$queryRaw`, actions without DB, or any operation that can't auto-track.

## Source files
- `packages/aura/src/server/db-tracked.ts` — tracked Prisma proxy
- `packages/aura/src/server/db-readonly.ts` — read-only proxy
- `packages/aura/src/server/pagination.ts` — cursor pagination
- `packages/aura/src/server/service.ts` — AuraService base
