# Step 02: Plan

**Task:** analyse the admin http://localhost:3001/fr/admin/dashboard
**Started:** 2026-03-28T07:38:48Z

---

## Technical Strategy

The goal is to refine the admin dashboard UI/UX based on the analysis.

### 1. Refine Chart Tooltip Locale
- **File:** `src/app/[locale]/(admin)/admin/dashboard/page.tsx`
- **Action:**
    - Accept `locale` in `AdminDashboardPage` props (Next.js 15+ uses `Promise<{ locale: string }>`).
    - Pass `locale` to `ChartTooltip` and `ResponsiveContainer`'s `AreaChart` components.
    - Replace hardcoded `'fr-FR'` with the dynamic `locale`.

### 2. Update Status Indicator
- **File:** `src/app/[locale]/(admin)/admin/dashboard/page.tsx`
- **Action:**
    - Change "Temps Réel" to something more accurate like "Auto-sync (30s)".
    - Consider adding a small info tooltip explaining the refresh interval.

### 3. Verify Layout Responsiveness
- **Action:**
    - Check the dashboard on different viewports.
    - Adjust padding/margins if needed for extreme screen sizes.

→ Ready for execution.
