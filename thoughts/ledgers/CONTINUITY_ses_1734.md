---
session: ses_1734
updated: 2026-06-03T09:04:48.458Z
---

# Session Summary

## Goal
Complete a comprehensive audit of all loader, spinner, and loading-related components, states, and CSS across the entire codebase.

## Constraints & Preferences
- Must identify all component definitions, usages, global state, and CSS
- Preserve exact file paths and import paths
- Surface both custom components and inline spinner implementations

## Progress
### Done
- [x] **Glob searched `src/`** for `*loader*`, `*spinner*`, `*loading*` pattern files
- [x] **Grep searched** for `import.*(Loader|Spinner|loading)`, `<RouteLoader>`, `<Spinner>`, `<Loader>`, `useLoading|LoadingProvider|LoadingContext`, and CSS class patterns across `*.{ts,tsx,js,jsx,css,scss,less}`
- [x] **Read full content of all core loading files:**
  - `src/common/spinner.tsx` — visual full-screen spinner with SVG + glowPulse animation
  - `src/common/route-loader.tsx` — wraps Spinner, triggered by router pending status (1.5s delay)
  - `src/common/global-loader.tsx` — wraps Spinner, driven by external loading store via `useSyncExternalStore`
  - `src/common/ui/spinner.tsx` — lightweight Lucide-based `Loader2Icon` spinner with `cn()` wrapper (different from the full-screen one)
  - `src/common/stores/loading.store.ts` — zero-dependency pub/sub store with `getState`, `setState`, `subscribe`, `reset`
  - `src/common/hooks/use-global-loading.ts` — React hook + imperative `loadingApi` for the global loading store
- [x] **Read all consumer files** that import/use loading components or lucide loading icons
- [x] **Verified CSS** in `src/global.css` — contains `@keyframes` for `loader` (horizontal slide), `fadeIn` (opacity), and `glowPulse` (scale/opacity pulse)

### In Progress
- (none — audit complete)

### Blocked
- (none)

## Key Decisions
- **Two separate `Spinner` components exist**: `src/common/spinner.tsx` (full-screen overlay with SVG + glow) vs `src/common/ui/spinner.tsx` (inline Lucide `Loader2Icon` wrapper). The first is used by `RouteLoader` and `GlobalLoader`; the second is an independent UI primitive.
- **No React Context provider for loading** — global loading uses a vanilla pub/sub store (`loading.store.ts`) consumed via `useSyncExternalStore` in both hook and component forms.
- **Route-level spinners use inline tailwind classes** (`animate-spin rounded-full border-4 border-[var(--lagoon)] border-t-transparent`) rather than shared components in `router.tsx`, `payment/result.tsx`, `my-space-skeleton.tsx`, `admin-dashboard.tsx`, `convert-page.tsx`, and `account-type-chooser.tsx`.

## Next Steps
(No immediate next steps — the audit is complete. The user may want to consolidate duplicate spinners, refactor inline spinners to use shared components, or standardize loading patterns.)

## Critical Context
### Complete File Inventory

**Dedicated Loading Component Files (6):**
1. `/home/afreeserv/projects/num_zer0/src/common/spinner.tsx` — Full‑screen overlay spinner (SVG, `animate-spin`, `animate-[fadeIn]`, `animate-[glowPulse]`)
2. `/home/afreeserv/projects/num_zer0/src/common/route-loader.tsx` — `RouteLoader` component, wraps Spinner, 1.5s delay on router pending
3. `/home/afreeserv/projects/num_zer0/src/common/global-loader.tsx` — `GlobalLoader` component, wraps Spinner, driven by `loadingStore`
4. `/home/afreeserv/projects/num_zer0/src/common/ui/spinner.tsx` — Lightweight `Spinner` (Lucide `Loader2Icon` + `cn()`)
5. `/home/afreeserv/projects/num_zer0/src/common/stores/loading.store.ts` — Pub/sub store: `LoadingState`, `loadingStore` object
6. `/home/afreeserv/projects/num_zer0/src/common/hooks/use-global-loading.ts` — `useGlobalLoading()` hook + `loadingApi` imperative API

**Files That IMPORT/USE Loading Components (consumers):**
| File | What it uses |
|---|---|
| `src/routes/__root.tsx` | `<RouteLoader />`, `<GlobalLoader />` |
| `src/common/route-loader.tsx` | `import { Spinner } from '#/common/spinner'` |
| `src/common/global-loader.tsx` | `import { Spinner } from '#/common/spinner'`, `import { loadingStore } from '#/common/stores/loading.store'` |
| `src/common/hooks/use-global-loading.ts` | `import { loadingStore } from '../stores/loading.store'` |

**Files Using Lucide Loading Icons (LoaderCircle, Loader2, Loader, Loader2Icon):**
| File | Icon | Context |
|---|---|---|
| `src/components/layout/mobile-bottom-nav.tsx` | `LoaderCircle` | logout button loading state (line 78) |
| `src/components/recharge/step-topup.tsx` | `LoaderCircle` | payment submission spinner (line 103) |
| `src/components/account/profile-form.tsx` | `LoaderCircle` | form save loading (line ~72) |
| `src/components/account/logout-button.tsx` | `LoaderCircle` | logout pending state (line 38) |
| `src/components/account/delete-account.tsx` | `Loader2` | delete confirmation button (line ~63) |
| `src/components/wallet/wallet-balance-total.tsx` | `Loader2` | balance loading state (line 19) |
| `src/common/ui/spinner.tsx` | `Loader2Icon` | base component |
| `src/common/ui/sonner.tsx` | `Loader2Icon` | sonner toast loading icon (line 26) |
| `src/common/ui/popover-form.tsx` | `Loader` | inline submit loading (line 138) |

**Files with Inline CSS Spinners (no shared component):**
| File | Implementation |
|---|---|
| `src/router.tsx:43-47` | `animate-spin rounded-full border-4 border-[var(--lagoon)] border-t-transparent` (defaultPendingComponent) |
| `src/routes/payment/result.tsx:18` | Same as above (pendingComponent) |
| `src/routes/payment/result.tsx:117` | Same pattern (verifying state) |
| `src/components/spa/my-space-skeleton.tsx:315` | `animate-spin rounded-full border-2 border-primary border-t-transparent` (iOS-style popup) |
| `src/components/admin/admin-dashboard.tsx:43` | `animate-spin rounded-full border-4 border-red-500 border-t-transparent` (admin loading) |
| `src/components/auth/convert-page.tsx:135` | `animate-spin rounded-full border-2 border-neutral-900 border-t-transparent` |
| `src/components/auth/account-type-chooser.tsx:191` | `animate-spin rounded-full border-2 border-white border-t-transparent` |

**CSS Animations (in `src/global.css`):**
- `@keyframes loader` (lines 37-44) — horizontal slide (translateX -100% to 150%)
- `@keyframes fadeIn` (lines 46-53) — opacity 0→1 (used in `spinner.tsx`)
- `@keyframes glowPulse` (lines 55-65) — opacity + scale pulse (used in `spinner.tsx` glow)

## File Operations
### Read
- `/home/afreeserv/projects/num_zer0/src/common/global-loader.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/hooks/use-global-loading.ts`
- `/home/afreeserv/projects/num_zer0/src/common/route-loader.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/spinner.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/stores/loading.store.ts`
- `/home/afreeserv/projects/num_zer0/src/common/ui/popover-form.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/ui/sonner.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/ui/spinner.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/ui/toast.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/account/delete-account.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/account/logout-button.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/account/profile-form.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/admin/admin-dashboard.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/auth/account-type-chooser.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/auth/convert-page.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/layout/mobile-bottom-nav.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/recharge/step-topup.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/spa/my-space-skeleton.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/wallet/wallet-balance-card.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/wallet/wallet-balance-total.tsx`
- `/home/afreeserv/projects/num_zer0/src/global.css`
- `/home/afreeserv/projects/num_zer0/src/router.tsx`
- `/home/afreeserv/projects/num_zer0/src/routes/__root.tsx`
- `/home/afreeserv/projects/num_zer0/src/routes/payment/result.tsx`

### Modified
- (none)
