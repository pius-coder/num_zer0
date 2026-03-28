# Step 01: Analyze

**Task:** analyse the admin http://localhost:3001/fr/admin/dashboard
**Started:** 2026-03-28T07:38:48Z

---

## Context Discovery

### 1. Route & File Structure
- **URL:** `http://localhost:3001/fr/admin/dashboard`
- **Page File:** `src/app/[locale]/(admin)/admin/dashboard/page.tsx`
- **Layout File:** `src/app/[locale]/(admin)/admin/layout.tsx` (uses `AdminShell`)
- **Core Components:**
    - `AdminPageShell`: Header wrapper with title/subtitle.
    - `KPICard`: Reusable stat card with trend and loading state.
    - `ChartTooltip` & `ChartActiveDot`: Custom Recharts components.

### 2. Data Flow
- **Hooks:** Located in `src/hooks/use-admin.ts`.
    - `useAdminDashboardStats`: Fetches key metrics (Revenue, Users, Pending, Fraud, Messages).
    - `useAdminRevenueChartData`: Fetches 30-day revenue trend.
- **Server Actions:** Located in `src/app/actions/admin-actions.ts`.
    - `getAdminDashboardStats`: Drizzle queries for real-time counts and sums.
    - `getAdminRevenueChartData`: Aggregated daily revenue for the past 30 days.

### 3. Security & Access
- **Auth:** Protected by `requireAdminSession()` from `src/lib/auth/require-admin.ts`.
- **Locale:** Handled via route parameter `[locale]`.

### 4. Observations & Potential Improvements
- **Hardcoded Locale:** Chart tooltip uses `fr-FR` explicitly instead of path-based locale.
- **Static Chart Range:** Data fetching is fixed at 30 days.
- **Refresh Interval:** Dashboard stats use a 30s refetch interval.
- **Design:** Modern dark-themed dashboard with glassmorphism and Lucide icons. Consistent with the rest of the application.

→ Analysis complete. Moving to planning.
