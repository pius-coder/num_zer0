# APEX Analysis: 01-audit-refactor-react-query

## Codebase Context

### Related Files Found
| Area | File | Lines | Purpose |
|------|------|-------|---------|
| Client | `src/components/features/wallet/wallet-page-shell.tsx` | 31-44 | Balance fetching |
| Client | `src/components/features/wallet/wallet-transaction-list.tsx` | 13-35 | Transaction history |
| Client | `src/components/features/recharge/recharge-drawer.tsx` | 65-85 | Package fetching |
| Admin | `src/app/[locale]/(admin)/admin/users/page.tsx` | 75-100 | Paginated user list |
| Admin | `src/app/[locale]/(admin)/admin/finance/page.tsx` | 80-120 | Purchase/Activation history |
| Admin | `src/app/[locale]/(admin)/admin/credits/page.tsx` | 40-70 | Credit package management |
| Admin | `src/app/[locale]/(admin)/admin/config/page.tsx` | 50-80 | System configuration |
| Admin | `src/app/[locale]/(admin)/admin/dashboard/page.tsx` | 30-60 | KPI stats |
| Admin | `src/app/[locale]/admin/logs/log-explorer.tsx` | 200-250 | Log searching |

### Patterns Observed
- **Inline Fetching**: Data fetching is mostly done using `useEffect` calling local `async` functions that use `fetch`.
- **State Management**: Manual `loading`, `error`, and `data` states using `useState`.
- **Mutations**: Side effects (creating purchases, updating config) use manual `fetch` calls inside event handlers.

### Utilities Available
- `src/app/_providers/query-provider.tsx` - Already provides `QueryClientProvider`.
- `src/lib/utils/` - Standard fetch wrappers if any.

## Documentation Insights
- **TanStack Query v5**: Recommended to use a singleton `QueryClient` on client, instance-per-request on server.
- **HydrationBoundary**: Preferred for server-side prefetching.
- **Query Key Factory**: Best practice for managing cache keys.

## Inferred Acceptance Criteria
- [ ] AC1: All data fetching in identified components replaced with `useQuery`.
- [ ] AC2: All data mutations in identified components replaced with `useMutation`.
- [ ] AC3: Creation of centralized hooks/query keys for shared domains.
- [ ] AC4: Consistent handling of loading/error states via React Query properties.
- [ ] AC5: Automatic cache invalidation after mutations (e.g., refreshing list after update).
- [ ] AC6: Type safety for all query/mutation data.
