import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

import { routing } from '@/i18n/routing'
import { APP_COOKIE_NAME } from '@/lib/constants'
import { extractLocale } from '@/lib/i18n/extract-locale'
import { createLogger, extractRequestContext, requestToLogFields } from '@/lib/logger'

const logger = createLogger({ prefix: 'proxy' })
const handleI18n = createMiddleware(routing)

const protectedPaths = ['/my-space', '/dashboard', '/account', '/billing']

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|fr|de|code)(?:\/|$)/, '') || '/'
  return protectedPaths.some((p) => withoutLocale.startsWith(p))
}

export default async function proxy(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname
  const locale = extractLocale(pathname)

  // Extract structured request context
  const reqCtx = extractRequestContext(request)
  reqCtx.locale = locale

  // Create request-scoped logger with all context fields
  const reqLog = logger.child({
    ...requestToLogFields(reqCtx),
    locale,
  })

  reqLog.info('request_start')

  // Redirect explicit non-localized paths early
  const firstSegment = pathname.split('/')[1]
  const locales = ['en', 'fr', 'de', 'code']

  if (
    pathname !== '/' &&
    !locales.includes(firstSegment) &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.includes('.')
  ) {
    const url = new URL(`/${locale}${pathname}`, request.url)
    reqLog.info('redirect_to_localized', { target: url.pathname })
    return NextResponse.redirect(url)
  }

  // Auth check for protected paths
  if (isProtectedPath(pathname)) {
    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: APP_COOKIE_NAME,
    })
    reqLog.debug('protected_path_session_check', {
      hasSessionCookie: Boolean(sessionCookie),
    })

    if (!sessionCookie) {
      reqLog.warn('unauthenticated_access_blocked')
      const loginUrl = new URL(`/${locale}/login`, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = await handleI18n(request)

  // Propagate request ID for downstream tracing
  response.headers.set('x-request-id', reqCtx.requestId)

  const durationMs = Date.now() - startTime
  reqLog.info('request_end', {
    statusCode: response.status,
    durationMs,
  })

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}