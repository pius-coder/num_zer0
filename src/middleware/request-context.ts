import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'request-context' })

export interface RequestContext {
  requestId: string
  userId?: string
  ip: string
  userAgent: string
  method: string
  path: string
  timestamp: string
}

/**
 * Extract request context from a Request object.
 * Used in API routes for audit logging and request tracing.
 *
 * ```typescript
 * const ctx = extractRequestContext(req)
 * log.info('api_call', { ...ctx, result: 'success' })
 * ```
 */
export function extractRequestContext(req: Request): RequestContext {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID().slice(0, 12)
  const url = new URL(req.url)

  return {
    requestId,
    ip,
    userAgent,
    method: req.method,
    path: url.pathname,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a child logger enriched with request context.
 *
 * ```typescript
 * const reqLog = createRequestLogger(req)
 * reqLog.info('service_called', { serviceSlug, countryIso })
 * ```
 */
export function createRequestLogger(req: Request) {
  const ctx = extractRequestContext(req)
  return log.child({
    requestId: ctx.requestId,
    ip: ctx.ip,
    method: ctx.method,
    path: ctx.path,
  })
}

/**
 * Build a request context with user identity (call after auth check).
 */
export function withUser(ctx: RequestContext, userId: string): RequestContext {
  return { ...ctx, userId }
}

/**
 * Format request context for audit log entries.
 * Returns a flat object suitable for database insertion.
 */
export function toAuditEntry(
  ctx: RequestContext,
  action: string,
  resource: string,
  result: 'success' | 'error',
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  return {
    requestId: ctx.requestId,
    userId: ctx.userId ?? null,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    action,
    resource,
    result,
    timestamp: ctx.timestamp,
    metadata: metadata ?? null,
  }
}
