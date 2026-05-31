# Todo — Changelog

## [1.0.0] — 2026-05-31

### Added
- Feature extracted from `routes/demo/convex.tsx` into `components/todo/` (afreeserv)
- `hooks/use-todos.ts` — Convex queries + mutations with optimistic updates
- `todo-add-form.tsx` — input + button using `useAddTodoMutation`
- `todo-item.tsx` — single todo row with toggle and delete
- `todo-list.tsx` — fetches via `@tanstack/react-query`, renders loading/empty/items
- `index.ts` barrel export for all components and hooks
- `routes/demo/convex.tsx` slimmed from 142 → 27 lines
