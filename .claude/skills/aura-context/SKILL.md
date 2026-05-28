---
name: aura-context
description: "Full AuraContext surface. Use when accessing ctx.* properties: auth, audit, log, notify, storage, scheduler, agent, cookies, paginate, track, runQuery/Mutation/Action."
---

# Aura Context

## Full ctx surface

### Core
| Property | Type | Description |
|---|---|---|
| `ctx.db` | `PrismaClient` | DB proxy (read-only/tracked/tombstoned per type) |
| `ctx.session` | `AuraSessionData \| null` | Current session |
| `ctx.user` | `AuraUser \| null` | Current user |
| `ctx.requestId` | `string` | Unique request ID |
| `ctx.source` | `string` | `"bridge" \| "rsc" \| "internal" \| "cron" \| "scheduler" \| "test"` |

### Auth
```ts
ctx.auth.setSessionCookie(token: string, expiresAt: Date): void;
ctx.auth.clearSessionCookie(): void;
```

### Logging
```ts
ctx.log.info(msg, meta?);
ctx.log.warn(msg, meta?);
ctx.log.error(msg, meta?);
ctx.log.debug(msg, meta?);
```

### Audit trail
```ts
await ctx.audit.record("todos.delete", { todoId: "123", reason: "user request" });
```

### Bumps (toast notifications)
```ts
ctx.bump.success(title, desc?);
ctx.bump.info(title, desc?);
ctx.bump.warning(title, desc?);
ctx.bump.error(title, desc?);
```

### Storage
```ts
// AuraStorage — key-value file storage
const url = await ctx.storage.store(file: File | Blob, path?: string);
await ctx.storage.get(path: string): Promise<Buffer>;
await ctx.storage.delete(path: string): Promise<void>;
```

### Scheduler
```ts
const id = await ctx.scheduler.runAfter(60_000, "cleanup.run", { olderThan: "7d" });
await ctx.scheduler.runAt(date, "report.generate", {});
await ctx.scheduler.cancel(scheduledId);
```

### Agent (AI)
```ts
const thread = await ctx.agent.createThread(ref);
const reply = await ctx.agent.generateText(thread, { prompt: "..." });
const stream = await ctx.agent.streamText(thread, { prompt: "..." });
const usage = await ctx.agent.getUsage({ since: date });
```

### Nested operation calls
```ts
const data = await ctx.runQuery("todos.list", { status: "PENDING" });
const todo = await ctx.runMutation("todos.create", { title: "New" });
await ctx.runAction("email.send", { to: user.email });
```

### Pagination
```ts
const result = await ctx.paginate(model, opts);
```

### Reactive tracking
```ts
ctx.track({ read: ["ExternalKey"] });
ctx.track({ write: ["ExternalKey"] });
```

### Request metadata
```ts
ctx.request.ip        // x-forwarded-for
ctx.request.userAgent // user-agent header
ctx.request.origin    // origin header
ctx.request.countryCode // cf-ipcountry
```

### Cookies
```ts
// Read-only: mutation queue applied after operation
ctx.cookies.set.push({ name, value, options });
```

### Explicit fetch (actions)
```ts
const resp = await ctx.fetch("https://api.example.com/data");
```

## Source files
- `packages/aura/src/server/context.ts` — AuraContext type
- `packages/aura/src/server/create-context.ts` — context factory
- `packages/aura/src/server/service.ts` — AuraService class
