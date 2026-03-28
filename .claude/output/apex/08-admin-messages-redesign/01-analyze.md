# Step 01: Analyze

**Task:** redesign admin messages page remove polling add to sidebar and right sidebar
**Started:** 2026-03-28T09:59:14Z

---

## Context Discovery

_Findings will be appended here as exploration progresses..._

## Codebase Context

### Related Files Found
| File | Lines | Contains |
|------|-------|----------|
| `src/app/[locale]/(admin)/admin/messages/page.tsx` | 1-295 | Main admin messages UI to be redesigned |
| `src/hooks/use-admin.ts` | 155-188 | `useAdminMessages` hook which contains `refetchInterval: 10000` |
| `src/app/[locale]/(admin)/admin/_components/admin-shell.tsx` | 37-64 | `NAV_SECTIONS` which needs the new sidebar link |
| `src/components/ui/table.tsx` | 1-130 | Standard Table components to build the requested DataTable |
| `src/components/ui/sheet.tsx` | 1-165 | Drawer components for the Right Sidebar |

### Patterns Observed
- **Polling**: Handled via React Query's `refetchInterval` in custom hooks inside `src/hooks/use-admin.ts`.
- **Sidebar Navigation**: Defined in `admin-shell.tsx` as a static array `NAV_SECTIONS`.
- **UI Components**: Uses shadcn/ui components (`Table`, `Sheet`, `Button`, `Avatar`, `ScrollArea`).

## Inferred Acceptance Criteria
- [ ] AC1: Remove `refetchInterval` from `useAdminMessages` to stop auto-polling.
- [ ] AC2: Add "/admin/messages" link to `NAV_SECTIONS` in `admin-shell.tsx`.
- [ ] AC3: Refactor `/admin/messages/page.tsx` to use a Table displaying user conversations instead of the dual-pane layout.
- [ ] AC4: Implement a `Sheet` (Right Sidebar) that opens when clicking a table row to show the conversation/details.
- [ ] AC5: Add a button/link inside the `Sheet` to navigate to `/admin/users/[userId]`.
- [ ] AC6: Add building the user details page (`/admin/users/[userId]`) to the project plan/tasks.
