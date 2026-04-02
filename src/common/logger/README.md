# Logger Package — Production-Grade Structured Logging

A comprehensive, production-ready logging solution for Next.js 16 applications
with structured JSON output, file persistence, and an internal log explorer UI.

## Architecture Overview

```
src/lib/logger/
├── index.ts                    # Unified entry point, auto-configures transports
├── schema.ts                   # Canonical StructuredLogEntry type, redaction, error normalization
├── structured.ts               # StructuredLogger class with transport dispatch
├── transport.ts                # Transport interface
├── request.ts                  # Request lifecycle helpers (context extraction)
├── log-reader.server.ts        # Server-only: reads JSONL files with bounded reading
├── transports/
│   ├── console.ts              # Console transport (all runtimes)
│   └── file.server.ts          # File transport (Node.js only, writes JSONL)
├── logger.ts                   # Legacy Logger (backward compat)
├── types.ts                    # Shared types and constants
├── formatter.ts                # Legacy ANSI formatter
├── serializer.ts               # Legacy tree serializer
├── ansi.ts                     # ANSI color codes
├── utils.ts                    # Runtime detection utilities
└── global.ts                   # Legacy global logger

logs/                           # Auto-created, date-partitioned JSONL files
├── app-2026-03-26.jsonl        # General application logs
├── error-2026-03-26.jsonl      # Error and fatal logs
├── access-2026-03-26.jsonl     # HTTP request/response logs
└── audit-2026-03-26.jsonl      # Audit trail (optional)

src/app/api/internal/logs/route.ts     # API endpoint for log querying
src/app/[locale]/admin/logs/page.tsx   # Log explorer UI page
```

## Quick Start

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'api-users' })

// Basic usage
log.info('User created', { userId: '123', email: 'alice@example.com' })
log.error('Failed to create user', new Error('DB timeout'), { userId: '123' })

// Child logger with inherited context
const reqLog = log.child({ requestId: 'abc-123', path: '/api/users' })
reqLog.info('Processing request')
reqLog.warn('Rate limit approaching', { remaining: 5 })
```

## Log Entry Schema

Every log entry conforms to `StructuredLogEntry`:

```typescript
interface StructuredLogEntry {
  // Required
  timestamp: string      // ISO 8601
  level: LogLevel        // trace | debug | info | warn | error | fatal
  message: string

  // Correlation
  requestId?: string
  traceId?: string
  spanId?: string

  // Source
  prefix?: string        // Logger namespace
  environment?: string   // server | client | edge
  runtime?: string       // node | edge | browser
  pid?: number
  hostname?: string

  // HTTP Context
  method?: string
  path?: string
  route?: string
  url?: string
  statusCode?: number
  durationMs?: number

  // User / Session
  userId?: string
  sessionId?: string

  // Client
  userAgent?: string
  ip?: string
  referer?: string
  locale?: string

  // Error
  error?: StructuredError

  // Arbitrary data
  data?: Record<string, unknown>
  context?: Record<string, unknown>

  // Log stream
  stream?: 'app' | 'error' | 'access' | 'audit'
}
```

## Runtime Behavior

| Runtime  | Console | File | Notes |
|----------|---------|------|-------|
| Node.js  | ✅      | ✅   | Full feature set |
| Edge     | ✅      | ❌   | No filesystem access |
| Browser  | ✅      | ❌   | Console only |

The `file.server.ts` transport uses Next.js `.server.ts` convention to ensure
it is never bundled for edge or client builds.

## File Logging

### Format: JSON Lines (.jsonl)

Each line is one valid JSON object:

```jsonl
{"timestamp":"2026-03-26T09:00:00.000Z","level":"info","message":"request_start","prefix":"proxy","requestId":"abc-123","method":"GET","path":"/fr/dashboard"}
{"timestamp":"2026-03-26T09:00:00.042Z","level":"info","message":"request_end","prefix":"proxy","requestId":"abc-123","statusCode":200,"durationMs":42}
```

### File Layout

- `logs/app-YYYY-MM-DD.jsonl` — General application logs
- `logs/error-YYYY-MM-DD.jsonl` — Error/fatal logs (also duplicated in app)
- `logs/access-YYYY-MM-DD.jsonl` — HTTP request lifecycle logs
- `logs/audit-YYYY-MM-DD.jsonl` — Audit trail

### Auto-stream Routing

- Entries with `level=error|fatal` → `error` stream
- Entries with `method` + `path` set → `access` stream
- Everything else → `app` stream
- You can override with `entry.stream = 'audit'`

### Buffering

The file transport buffers writes for efficiency:
- Flushes every 500ms or when buffer reaches 50 entries
- Call `logger.flush()` before process exit to avoid data loss
- The flush timer uses `unref()` so it won't keep Node.js alive

## Request Context

### Middleware / Proxy

```typescript
import { createLogger, extractRequestContext, requestToLogFields } from '@/lib/logger'

const log = createLogger({ prefix: 'proxy' })

export default async function proxy(request: NextRequest) {
  const ctx = extractRequestContext(request)
  const reqLog = log.child(requestToLogFields(ctx))

  reqLog.info('request_start')
  // ... handle request
  reqLog.info('request_end', { statusCode: 200, durationMs: 42 })
}
```

### API Routes

```typescript
import { createLogger, extractRequestContext, requestToLogFields } from '@/lib/logger'

const log = createLogger({ prefix: 'api-users' })

export async function GET(request: NextRequest) {
  const ctx = extractRequestContext(request)
  const reqLog = log.child(requestToLogFields(ctx))

  try {
    reqLog.info('fetching_users')
    const users = await db.user.findMany()
    reqLog.info('users_fetched', { count: users.length })
    return Response.json(users)
  } catch (err) {
    reqLog.error('fetch_failed', err instanceof Error ? err : new Error(String(err)))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Server Actions

```typescript
'use server'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'action-create-user' })

export async function createUser(formData: FormData) {
  log.info('creating_user', { email: formData.get('email') as string })
  // ...
}
```

## Redaction

Sensitive keys are automatically redacted from `data` payloads:

```typescript
log.info('Headers received', {
  authorization: 'Bearer eyJ...',  // → [REDACTED]
  cookie: 'session=abc',           // → [REDACTED]
  'content-type': 'application/json', // → preserved
})
```

Redacted keys: `authorization`, `cookie`, `set-cookie`, `password`, `token`,
`secret`, `api_key`, `apikey`, `access_token`, `refresh_token`, `private_key`,
`credit_card`, `ssn`, `x-api-key`.

## Error Normalization

```typescript
try {
  throw new Error('Connection timeout')
} catch (err) {
  log.error('Database failed', err)
  // Error is automatically normalized to:
  // { name: "Error", message: "Connection timeout", stack: "...", cause: ... }
}
```

## Internal Log Explorer

### Access

Navigate to: `/{locale}/admin/logs` (e.g., `/fr/admin/logs`)

### Security

- **Development**: Open access (no key required)
- **Production**: Set `INTERNAL_ADMIN_KEY` env variable. Pass it as:
  - Header: `x-admin-key: your-key`
  - Query param: `?adminKey=your-key`

### Features

- Filter by: level, prefix, date range, text search, requestId, path
- Stream selector: app, error, access, audit
- Paginated results (50 per page)
- Expandable detail panel with full entry data
- Error stack trace display
- Raw JSON view
- Copy requestId to clipboard

### API Endpoint

```
GET /api/internal/logs?streams=app,error&level=error&search=timeout&page=1&pageSize=50
GET /api/internal/logs?action=stats
```

## Bounded File Reading

The log reader never loads entire files into memory:

1. Reads last 5MB of each file (tail-like)
2. Discards first (potentially partial) line when starting mid-file
3. Limits to 5000 lines per file
4. Filters and paginates in memory after parsing

## Performance Tips

- Use `log.debug()` for verbose logging — filtered out in production
- The file transport buffers writes; individual `log.info()` calls are cheap
- Child loggers are lightweight — create per-request loggers freely
- Avoid logging large objects in `data`; redaction still processes them

## Backward Compatibility

The old `Logger` class and `createLogger` function signature still work:

```typescript
// Old style (still works)
import { createLogger } from '@/lib/logger'
const log = createLogger({ prefix: 'old-code' })
log.info('Still works', { key: 'value' })

// New structured API
log.error('With error', new Error('boom'), { extra: 'data' })
log.child({ requestId: '...' }).info('Child logger')
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Controls log level and formatting | `development` |
| `INTERNAL_ADMIN_KEY` | Secret for log explorer access | _(none, dev=open)_ |

## Troubleshooting

### No log files created?
- Check you're running in Node.js runtime (not edge)
- Verify `logs/` directory is writable
- The file transport creates the directory automatically

### Log explorer shows "Unauthorized"?
- In production, set `INTERNAL_ADMIN_KEY` env variable
- In development, it should work without a key

### Missing context in logs?
- Use `child()` to create request-scoped loggers
- Use `extractRequestContext()` for HTTP context
- Child loggers inherit parent context