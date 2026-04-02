import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ServiceError, isServiceError } from '@/services/base.service'
import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'api-error' })

export interface ApiErrorResponse {
  error: string
  message: string
  details?: Record<string, unknown>
  requestId?: string
}

/**
 * Unified error handler for API routes.
 *
 * Usage:
 * ```typescript
 * export async function POST(req: Request) {
 *   try {
 *     // ... business logic ...
 *   } catch (err) {
 *     return handleError(err)
 *   }
 * }
 * ```
 */
export function handleError(error: unknown, requestId?: string): NextResponse<ApiErrorResponse> {
  // ServiceError → map to HTTP status
  if (isServiceError(error)) {
    const status = error.toHttpStatusCode()
    log.error('service_error', {
      code: error.code,
      status,
      message: error.message,
      requestId,
    })
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(requestId && { requestId }),
      },
      { status }
    )
  }

  // ZodError → 400 with field details
  if (error instanceof ZodError) {
    const details: Record<string, unknown> = {}
    for (const issue of error.issues) {
      const path = issue.path.join('.')
      details[path] = issue.message
    }
    log.warn('validation_error', { details, requestId })
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'Invalid input data',
        details,
        ...(requestId && { requestId }),
      },
      { status: 400 }
    )
  }

  // Plain Error with 'unauthorized' message (from requireSession)
  if (error instanceof Error && error.message === 'unauthorized') {
    log.warn('unauthorized', { requestId })
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Authentication required',
        ...(requestId && { requestId }),
      },
      { status: 401 }
    )
  }

  // Unknown error → 500
  log.error('unhandled_error', {
    error: error instanceof Error ? error.message : String(error),
    requestId,
  })

  return NextResponse.json(
    {
      error: 'internal_error',
      message: 'An unexpected error occurred',
      ...(requestId && { requestId }),
    },
    { status: 500 }
  )
}

/**
 * Create a typed error response without using handleError.
 * Useful for explicit responses in webhook handlers.
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: code,
      message,
      ...(requestId && { requestId }),
    },
    { status }
  )
}
