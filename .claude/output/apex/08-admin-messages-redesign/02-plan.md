# Step 02: Plan

**Task:** redesign admin messages page remove polling add to sidebar and right sidebar
**Started:** 2026-03-28T09:59:14Z

---

## Planning Progress

_Implementation plan will be written here..._
## Implementation Plan: Redesign Admin Messages Page

### Overview
Refactor the admin messages page to stop auto-polling, add it to the main sidebar, and replace the split-pane layout with a DataTable and a Right Sidebar (Sheet) for conversations.

### File Changes

#### src/hooks/use-admin.ts
- Remove refetchInterval: 10000 from useAdminMessages to stop the excessive 10-second polling.

#### src/app/[locale]/(admin)/admin/_components/admin-shell.tsx
- Import MessageCircle from lucide-react.
- Add { href: '/admin/messages', label: 'Messages', icon: MessageCircle } to NAV_SECTIONS under Management.

#### src/app/[locale]/(admin)/admin/messages/page.tsx
- Replace the grid-based split pane layout with a standard layout.
- Build a DataTable (using Table from components/ui/table) to list conversations.
- Columns: User (Avatar + Name), Message Snippet, Date, Unread Indicator.
- Add a Sheet component side='right' (Right Sidebar) to display the conversation.
- Use the existing Chat Header, Viewport, and Input logic inside the SheetPanel/SheetContent.
- Add a Button 'Voir le profil' in the SheetHeader linking to /admin/users/[userId].

### Acceptance Criteria Mapping
- [x] AC1: Satisfied by changes in src/hooks/use-admin.ts
- [x] AC2: Satisfied by changes in admin-shell.tsx
- [x] AC3 & AC4 & AC5: Satisfied by changes in messages/page.tsx
- [x] AC6: Update task.md to include User Details page
