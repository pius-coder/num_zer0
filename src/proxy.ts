import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

/**
 * Next.js 16+ convention: `proxy.ts` (replaces `middleware.ts`).
 * Must live next to `src/app` so locale rewrites apply to `/` → `[locale]`.
 */
export default function proxy(request: NextRequest) {
  return handleI18n(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
