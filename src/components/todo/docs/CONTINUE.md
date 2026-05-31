# Todo — Continue Guide

## Current State

Fully functional CRUD todo list backed by Convex:
- Add, toggle complete, delete — all with optimistic updates
- Loading spinner, empty state, items list with stats
- Built with shadcn `Button` component

## Architecture

### Data Flow
- `todoQueries.list()` — descriptor consumed by `@tanstack/react-query`'s `useQuery`
- Mutations use `useConvexMutation` + `withOptimisticUpdate` for instant UI
- Optimistic updates directly manipulate the React Query cache via `localStore`

### Key Files
| File | Responsibility |
|------|---------------|
| `hooks/use-todos.ts` | Query descriptors + mutation hooks with optimistic updates |
| `todo-add-form.tsx` | Input form, local state, mutation call |
| `todo-item.tsx` | Single row, toggle + delete buttons |
| `todo-list.tsx` | Data fetching, loading/empty/items states, stats |
| `index.ts` | Barrel exports |

### Convex Backend (`convex/`)
- `schema.ts` — `todos` table: `text`, `completed`
- `todos.ts` — `list` (query), `add`/`toggle`/`remove` (mutations)

## Known Issues

None currently.

## Next Steps

- [ ] Add edit-in-place for todo text
- [ ] Add due dates or priority levels
- [ ] Add filtering (all / active / completed)
- [ ] Move to TanStack Router loader for SSR data prefetch
