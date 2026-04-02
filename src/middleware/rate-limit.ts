import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'rate-limit' })

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitConfig {
  /** Max requests per window */
  max: number
  /** Window in milliseconds */
  windowMs: number
  /** Optional: prefix for the bucket key */
  prefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
  limit: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  max: 30,
  windowMs: 60_000,
  prefix: 'rl',
}

/**
 * Token bucket rate limiter.
 *
 * Usage in API routes:
 * ```typescript
 * const { allowed, remaining, retryAfterMs } = rateLimit(userId)
 * if (!allowed) {
 *   return Response.json({ error: 'rate_limited' }, {
 *     status: 429,
 *     headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
 *   })
 * }
 * ```
 */
export function rateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): RateLimitResult {
  const { max, windowMs, prefix = 'rl' } = config
  const bucketKey = `${prefix}:${key}`
  const now = Date.now()

  let bucket = buckets.get(bucketKey)

  if (!bucket) {
    bucket = { tokens: max, lastRefill: now }
    buckets.set(bucketKey, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill
  const refillRate = max / windowMs
  bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterMs: 0,
      limit: max,
    }
  }

  const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRate)

  log.warn('rate_limit_exceeded', { key: bucketKey, retryAfterMs })

  return {
    allowed: false,
    remaining: 0,
    retryAfterMs,
    limit: max,
  }
}

/**
 * Get client key from request. Prefers userId, falls back to IP.
 */
export function getClientKey(userId: string | undefined, req: Request): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  return `ip:${ip}`
}

/**
 * Cleanup stale buckets. Call periodically in long-running processes.
 */
export function cleanupStaleBuckets(maxAgeMs = 300_000): void {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > maxAgeMs) {
      buckets.delete(key)
    }
  }
}
