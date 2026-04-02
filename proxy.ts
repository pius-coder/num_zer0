import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing, locales } from "@/i18n/routing";

const handleI18n = createIntlMiddleware(routing);

const protectedPrefixes = ["/my-space", "/dashboard", "/account"];
const validLocales = locales as readonly string[];

function isProtectedPath(pathname: string): boolean {
  const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return protectedPrefixes.some((prefix) => {
    if (path === prefix) return true;
    if (path.startsWith(`${prefix}/`)) return true;
    return false;
  });
}

function getLocaleFromPath(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (segment && validLocales.includes(segment)) return segment;
  return "fr";
}

export async function proxy(request: NextRequest) {
  const start = performance.now();
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID().slice(0, 8);

  // ─── Guard: redirect non-localized paths to localized ─────────────────
  // Paths like /my-space must become /fr/my-space before any auth check
  const firstSegment = pathname.split("/")[1];
  if (
    pathname !== "/" &&
    firstSegment &&
    !validLocales.includes(firstSegment) &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  ) {
    const url = new URL(`/fr${pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  // ─── Auth check for protected page routes ─────────────────────────────
  // API routes are NOT matched by this middleware (see matcher config below)
  if (isProtectedPath(pathname)) {
    const cookieName = "app.session_token";
    const hasSession = request.cookies.has(cookieName);

    if (!hasSession) {
      const locale = getLocaleFromPath(pathname);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── i18n routing ─────────────────────────────────────────────────────
  const response = handleI18n(request);

  // ─── Inject request ID ────────────────────────────────────────────────
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (handled by API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - _vercel (Vercel internals)
     * - Files with extensions (.ico, .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|_vercel|.*\\..*).*)",
  ],
};
