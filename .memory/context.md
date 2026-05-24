# num_zer0 — Agent Memory

## Project
SMS activation platform. Next.js 16 (App Router) · Bun 1.2 · PostgreSQL + Drizzle ORM · Better-Auth · TailwindCSS 4 · React Router v7 (SPA pages).
Payments: Fapshi only. SMS: GrizzlySMS + SMSMan.

## Branch Strategy
- `v2` → `feat/spa-routing` (SPA migration) → `fix/theme-system` (theme fix)
- PR #1: `feat/spa-routing → main` (open, unmerged)
- `fix/theme-system` branch exists but no PR yet (need GH token — now have it)

## Current State
### Done
- Postgres `numzero-postgres` (port 5433), migrations run, seed: admin (`+237650000000` / `admin123`)
- Dev server systemd service (`numzero-dev.service`), tunnel cloudflared (`cloudflared-numzero.service`)
- Tunnel: `numzero.globalimex.online → localhost:3000` (Cloudflare Zero Trust, token-based)
- `.env`: `BETTER_AUTH_URL` + `NEXT_PUBLIC_APP_URL` = `https://numzero.globalimex.online`
- `next.config.ts`: `allowedDevOrigins`, `images.remotePatterns`, rewrites SPA, CSP security headers
- SPA via React Router v7 (BrowserRouter, basename=/${locale}) in `(main)/[...spa]/page.tsx`
- SPA pages as static imports (no next/dynamic, no flash noir)
- Navigation components (DesktopHeader, MobileBottomNav, MobileHeader) use react-router-dom (Link, useLocation)
- **Bug fix**: SPA links use absolute paths (/wallet) not /${locale}/wallet (basename handles prefix)
- **40 admin files deleted**: 27 pages + 13 API routes
- **Theme**: `:root` = light, `.dark` = dark; `enableSystem={true}`, `defaultTheme='system'`; ThemeSwitcher in headers
- **Auth serveur**: `(main)/layout.tsx` = server component with `getServerSession()` + `redirect()`
- **Loading**: `loading.tsx` in `(main)` shows MySpaceSkeleton during auth resolution
- **gh CLI authenticated** (account: pius-coder, token scopes: full)
- **`.memory/` directory** created (gitignored) for persistent agent context

### Pending
1. Create/finalize PR `fix/theme-system` on `feat/spa-routing`
2. Migrate Grizzly SMS → SMS Online Pro (provider refactor)
3. Refactor back-office, banque/crédit system

## Key Architecture
- `proxy.ts` (Next.js 16 middleware): i18n + auth guard (cookie check) — protectedPrefixes: /my-space, /dashboard, /account
- Catch-all `[...spa]` under `(main)` handles SPA routes (≥1 segment — /fr goes to landing page)
- Auth flow: middleware cookie check → layout `getServerSession()` (React.cache()) → redirect if no session
- React Query hooks use `initialData` for instant first paint
- DB: `service_with_availability` view, `user_wallet_summary` view, `dashboard_kpis` materialized view (refresh 60s)
- `@custom-variant dark (&:is(.dark *))` for Tailwind v4 dark variant
- Server is 2 CPU only → prefer `tsc --noEmit` over full `next build` for type checking

## Important Files
- `app/layout.tsx` — root layout, ThemeProvider `enableSystem={true}`, `defaultTheme='system'`
- `app/_styles/globals.css` — CSS variables (light/dark)
- `app/[locale]/(main)/[...spa]/page.tsx` — SPA entry (BrowserRouter, static imports)
- `app/[locale]/(main)/layout.tsx` — server auth guard
- `app/[locale]/(main)/loading.tsx` — MySpaceSkeleton
- `proxy.ts` — middleware i18n + auth
- `next.config.ts` — rewrites, CSP, allowedDevOrigins
- `src/component/spa/my-space-skeleton.tsx` — skeleton page
- `src/component/layout/` — DesktopHeader (ThemeSwitcher), MobileBottomNav, MobileHeaderLogo (ThemeSwitcher)
- `src/component/ui/theme-switcher.tsx` — Sun/Moon toggle
- `src/common/auth/get-server-session.ts` — cached getServerSession()
