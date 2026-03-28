# Step 2: Plan - Implementation Strategy

## Goal
Sync the database schema by applying the missing `support_messages` migration and verify the functionality of the admin dashboard and support messages UI.

## Proposed Changes

### Database Sync
1. **Apply Migration**: Run `bun run migrate:local` to execute `migrations/0003_open_paladin.sql`.
   - This creates the `support_messages` table and `support_direction` enum.

### Verification
1. **Dashboard Overview**: Refresh `/fr/admin/dashboard` to confirm `getAdminDashboardStats` (line 334 in `admin-actions.ts`) now succeeds.
2. **Messages Dashboard**: Access `/fr/admin/admin/messages` to confirm the page loads and the `useAdminMessages` hook fetches data (initially empty).
3. **Data Integrity**: (Optional) Send a test message from a user perspective to verify the end-to-end flow.

## Acceptance Criteria
- [x] AC1: Migration file `migrations/0003_open_paladin.sql` correctly generated. (Done)
- [ ] AC2: `support_messages` table exists in the database.
- [ ] AC3: Admin dashboard loads without 500 errors.
- [ ] AC4: Admin messages page loads without 500 errors.
