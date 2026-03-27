# APEX Plan: 01-audit-refactor-react-query

## Overview
Migrate all data fetching from `fetch` + `useEffect` to TanStack Query (v5). The strategy is to create centralized custom hooks for each domain (Credits, Admin) to encapsulate query keys and fetch logic, then replace the states/effects in the UI components.

## Prerequisites
- [x] `@tanstack/react-query` installed
- [x] `QueryProvider` configured in `src/app/_providers/query-provider.tsx`

---

## File Changes

### 1. New Hooks (Centralized Data Fetching)

#### `src/hooks/use-credits.ts` (NEW FILE)
- Define `creditKeys` factory.
- Export `useBalance()` - calls `/api/client/credits/balance`.
- Export `usePackages()` - calls `/api/client/credits/packages`.
- Export `useTransactions()` - calls `/api/client/credits/history`.
- Export `useCreatePurchase()` - `useMutation` for `/api/client/credits/purchase`.

#### `src/hooks/use-admin.ts` (NEW FILE)
- Define `adminKeys` factory.
- Export `useAdminUsers(page, limit)` - calls `/api/admin/users`.
- Export `useAdminPurchases(page, limit)` - calls `/api/admin/purchases`.
- Export `useAdminStats()` - calls dashboard stats API.
- Export `useAdminConfig()` - calls `/api/admin/config`.

### 2. Client Components Migration

#### `src/components/features/wallet/wallet-page-shell.tsx`
- Replace `useEffect` (lines 42-44) and `useState` (lines 18-19) with `useBalance()`.
- In the feedback `useEffect` (lines 46-58), replace `void reloadBalance()` with `queryClient.invalidateQueries({ queryKey: creditKeys.balance() })`.

#### `src/components/features/wallet/wallet-transaction-list.tsx`
- Replace `useEffect` (lines 21-35) and `useState` (lines 13-16) with `useTransactions()`.

#### `src/components/features/recharge/recharge-drawer.tsx`
- Replace `fetchPackages` `useEffect` (lines 126-140) with `usePackages()`.
- Replace `handleRecharge` manual `fetch` (lines 92-115) with `useCreatePurchase()` mutation.

### 3. Admin Pages Migration

#### `src/app/[locale]/(admin)/admin/users/page.tsx`
- Replace manual fetching (lines 75-100) with `useAdminUsers()`.
- Handle pagination state by passing it to the hook.

#### `src/app/[locale]/(admin)/admin/finance/page.tsx`
- Replace manual fetching (lines 80-120) with `useAdminPurchases()`.

#### `src/app/[locale]/(admin)/admin/dashboard/page.tsx`
- Replace manual fetching (lines 30-60) with `useAdminStats()`.

#### `src/app/[locale]/admin/logs/log-explorer.tsx`
- Refactor `doSearch` to use `useQuery`.
- Ensure infinite scroll or pagination still works with React Query.

---

## Testing Strategy
1. **Types Verification**: Run `tsc --noEmit` after each major file group.
2. **Manual Regression**:
   - Check Wallet balance refresh after recharge simulation.
   - Check User list pagination in Admin.
   - Confirm Admin Dashboard stats load correctly.
   - Verify error handling (UI should show error states when API fails).

## Acceptance Criteria Mapping
- [ ] AC1: All `useEffect` fetches replaced with `useQuery` (Mapped to all listed components).
- [ ] AC2: All `fetch` mutations replaced with `useMutation` (Mapped to `RechargeDrawer`).
- [ ] AC3: Centralized hooks implemented in `src/hooks/`.
- [ ] AC4: Consistent loading/error UI using `isLoading` / `isError` from React Query.
- [ ] AC5: Cache invalidation works after confirmed payment.
