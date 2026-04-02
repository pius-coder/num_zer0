import { db as dbInstance } from '@/database'
import { createLogger } from '@/common/logger'
import type { PostgresJsTransaction } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type * as schema from '@/database/schema'

// ─── Error Codes ────────────────────────────────────────────────────────────

export const SERVICE_ERROR_CODES = {
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation_error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  CONFLICT: 'conflict',
  RATE_LIMITED: 'rate_limited',
  INSUFFICIENT_CREDITS: 'insufficient_credits',
  HOLD_NOT_DEBITABLE: 'hold_not_debitable',
  PURCHASE_NOT_FOUND: 'purchase_not_found',
  PURCHASE_NOT_CONFIRMED: 'purchase_not_confirmed',
  ACTIVATION_NOT_FOUND: 'activation_not_found',
  SERVICE_NOT_FOUND: 'service_not_found',
  NO_PROVIDER_CANDIDATE: 'no_provider_candidate',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  PROVIDER_INSUFFICIENT_FUNDS: 'provider_insufficient_funds',
  GRIZZLY_NO_BALANCE: 'grizzly_no_balance',
  GRIZZLY_LOW_BALANCE: 'grizzly_low_balance',
  ALL_PROVIDERS_FAILED: 'all_providers_failed',
  PAYMENT_NOT_INITIATED: 'payment_not_initiated',
  PAYMENT_NOT_SUCCESSFUL: 'payment_not_successful',
} as const

export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[keyof typeof SERVICE_ERROR_CODES]

// ─── Typed Error ────────────────────────────────────────────────────────────

const HTTP_CODE_MAP: Record<string, number> = {
  not_found: 404,
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
  rate_limited: 429,
  insufficient_credits: 402,
  hold_not_debitable: 402,
  purchase_not_found: 404,
  purchase_not_confirmed: 402,
  activation_not_found: 404,
  service_not_found: 404,
  no_provider_candidate: 404,
  provider_unavailable: 503,
  provider_insufficient_funds: 402,
  grizzly_no_balance: 503,
  grizzly_low_balance: 503,
  all_providers_failed: 503,
  payment_not_initiated: 400,
  payment_not_successful: 402,
}

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode | (string & {}),
    message: string,
    public readonly context?: Record<string, unknown>,
    public override readonly cause?: unknown
  ) {
    super(message, { cause })
    this.name = 'ServiceError'
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    }
  }

  toHttpStatusCode(): number {
    return HTTP_CODE_MAP[this.code] ?? 500
  }
}

// ─── Type Guards ────────────────────────────────────────────────────────────

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError
}

export function isTimeoutError(error: unknown): boolean {
  if (isServiceError(error)) return error.code === 'http_timeout'
  if (error instanceof DOMException) return error.name === 'AbortError'
  return false
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// ─── Configuration ──────────────────────────────────────────────────────────

export interface ServiceLogger {
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  debug(message: string, data?: Record<string, unknown>): void
}

export interface RetryPolicy {
  maxAttempts: number
  baseDelayMs?: number
  maxDelayMs?: number
  retryOn?: (error: unknown) => boolean
}

export interface HttpClientConfig {
  baseUrl: string
  headers?: Record<string, string>
  timeoutMs?: number
}

export interface HttpRequestOptions {
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string>
  timeoutMs?: number
}

export interface ServiceConfig {
  prefix: string
  db?: boolean | typeof dbInstance
  http?: HttpClientConfig
  retry?: RetryPolicy
  logger?: ServiceLogger
}

// ─── Default retry predicate ────────────────────────────────────────────────

function defaultRetryOn(err: unknown): boolean {
  if (isServiceError(err)) {
    const status = err.toHttpStatusCode()
    return status >= 500 || status === 429
  }
  return true
}

// ─── Abstract Base Class ────────────────────────────────────────────────────

type DbInstance = typeof dbInstance

/** Drizzle transaction type derived from the postgres-js driver */
export type DrizzleTx = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

export abstract class BaseService {
  public readonly log: ServiceLogger
  protected readonly db: DbInstance
  protected readonly retryPolicy: Required<RetryPolicy>
  private readonly httpConfig: HttpClientConfig | undefined

  constructor(config: ServiceConfig) {
    this.log = config.logger ?? createLogger({ prefix: config.prefix })

    if (config.db === true) {
      this.db = dbInstance
    } else if (config.db && typeof config.db === 'object') {
      this.db = config.db as DbInstance
    } else {
      // Intentional double-assertion: guard proxy throws at runtime if db is
      // accessed without enabling it in ServiceConfig. The cast is safe because
      // no real DB method is ever called on this object.
      this.db = new Proxy({} as unknown as DbInstance, {
        get(_target, prop) {
          throw new ServiceError(
            'db_not_configured',
            `Cannot access this.db.${String(prop)} — enable DB in ServiceConfig: { db: true }`
          )
        },
      })
    }

    this.httpConfig = config.http

    this.retryPolicy = {
      maxAttempts: config.retry?.maxAttempts ?? 1,
      baseDelayMs: config.retry?.baseDelayMs ?? 1_000,
      maxDelayMs: config.retry?.maxDelayMs ?? 30_000,
      retryOn: config.retry?.retryOn ?? defaultRetryOn,
    }
  }

  // ─── Error Helpers ──────────────────────────────────────────────────────

  public error(
    code: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: unknown
  ): ServiceError {
    const err = new ServiceError(code, message, context, cause)
    this.log.error(code, { message, ...context })
    return err
  }

  public assert(
    condition: unknown,
    code: string,
    message: string,
    context?: Record<string, unknown>
  ): asserts condition {
    if (!condition) {
      throw this.error(code, message, context)
    }
  }

  // ─── Retry ──────────────────────────────────────────────────────────────

  public async withRetry<T>(fn: () => Promise<T>, label = 'operation'): Promise<T> {
    const { maxAttempts, baseDelayMs, maxDelayMs, retryOn } = this.retryPolicy

    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err

        if (!retryOn(err)) {
          throw err
        }

        const isLastAttempt = attempt === maxAttempts - 1
        if (isLastAttempt) {
          break
        }

        const delay = baseDelayMs * 2 ** attempt
        const jitter = Math.random() * baseDelayMs * 0.5
        const delayMs = Math.min(delay + jitter, maxDelayMs)

        this.log.warn('retry_attempt', {
          label,
          attempt: attempt + 1,
          maxAttempts,
          delayMs: Math.round(delayMs),
          error: err instanceof Error ? err.message : String(err),
        })

        await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw lastError
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────

  private requireHttp(): HttpClientConfig {
    if (!this.httpConfig) {
      throw new ServiceError(
        'http_not_configured',
        'HTTP client not configured. Pass `http: { baseUrl: "..." }` in ServiceConfig.'
      )
    }
    return this.httpConfig
  }

  protected async httpRequest<T>(
    method: string,
    path: string,
    options?: HttpRequestOptions
  ): Promise<T> {
    const config = this.requireHttp()
    const normalizedPath = path.replace(/^\//, '')
    const base = config.baseUrl.replace(/\/$/, '')
    const url = new URL(normalizedPath ? `${base}/${normalizedPath}` : base)

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value)
      }
    }

    const timeoutMs = options?.timeoutMs ?? config.timeoutMs ?? 10_000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          ...(options?.body ? { 'Content-Type': 'application/json' } : undefined),
          ...config.headers,
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw this.error(
          `http_${response.status}`,
          `HTTP ${response.status}: ${response.statusText}`,
          { method, url: url.toString(), status: response.status }
        )
      }

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T
      }

      const text = await response.text()
      return text ? (JSON.parse(text) as T) : (undefined as T)
    } catch (err) {
      if (isServiceError(err)) throw err

      if (controller.signal.aborted) {
        throw this.error(
          'http_timeout',
          `Request timed out after ${timeoutMs}ms`,
          { method, url: url.toString(), timeoutMs },
          err
        )
      }

      throw this.error(
        'http_network_error',
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
        { method, url: url.toString() },
        err
      )
    } finally {
      clearTimeout(timer)
    }
  }

  /** Fetch raw text without JSON parsing (for GrizzlySMS plain-text endpoints) */
  public async httpGetText(
    path: string,
    options?: Omit<HttpRequestOptions, 'body'>
  ): Promise<string> {
    const config = this.requireHttp()
    const normalizedPath = path.replace(/^\//, '')
    const base = config.baseUrl.replace(/\/$/, '')
    const url = new URL(normalizedPath ? `${base}/${normalizedPath}` : base)

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value)
      }
    }

    const timeoutMs = options?.timeoutMs ?? config.timeoutMs ?? 10_000
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          ...config.headers,
          ...options?.headers,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw this.error(
          `http_${response.status}`,
          `HTTP ${response.status}: ${response.statusText}`,
          { method: 'GET', url: url.toString(), status: response.status }
        )
      }

      return await response.text()
    } catch (err) {
      if (isServiceError(err)) throw err

      if (controller.signal.aborted) {
        throw this.error(
          'http_timeout',
          `Request timed out after ${timeoutMs}ms`,
          { method: 'GET', url: url.toString(), timeoutMs },
          err
        )
      }

      throw this.error(
        'http_network_error',
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
        { method: 'GET', url: url.toString() },
        err
      )
    } finally {
      clearTimeout(timer)
    }
  }

  public httpGet<T>(path: string, options?: Omit<HttpRequestOptions, 'body'>): Promise<T> {
    return this.httpRequest<T>('GET', path, options)
  }

  protected httpPost<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.httpRequest<T>('POST', path, options)
  }

  protected httpPut<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.httpRequest<T>('PUT', path, options)
  }

  protected httpPatch<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.httpRequest<T>('PATCH', path, options)
  }

  protected httpDelete<T>(path: string, options?: Omit<HttpRequestOptions, 'body'>): Promise<T> {
    return this.httpRequest<T>('DELETE', path, options)
  }

  // ─── DB Utilities ───────────────────────────────────────────────────────

  protected async transaction<T>(
    fn: (tx: DrizzleTx) => Promise<T>,
    label = 'transaction'
  ): Promise<T> {
    this.log.debug('transaction_start', { label })

    try {
      const result = await this.db.transaction(fn)
      this.log.debug('transaction_commit', { label })
      return result
    } catch (err) {
      this.log.error('transaction_rollback', {
        label,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  protected generateId(entityPrefix: string): string {
    return `${entityPrefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  }
}
