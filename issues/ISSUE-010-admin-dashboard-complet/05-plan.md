# Phase 5 — Plan (corrigé après reanalyse)

13 steps atomiques (vs 12 initialement) — split Convex en 2 steps (queries ≠ mutations):

1. **Step 1** — Convex queries admin (pattern isAdmin manuel)
   - getAllPurchases, getAllActivations, getAllComptes, getAllPieces

2. **Step 2** — Convex CRUD files (mutations avec requireAdmin)
   - promo_codes.ts, margins.ts, packages.ts

3. **Step 3** — Hooks React Query admin (adminKeys factory)

4. **Step 4** — Layout admin + sidebar + route (ssr:false)

5. **Step 5** — Module Analytics (KPI grid)

6. **Step 6** — Module Users (table + delete dialog)

7. **Step 7** — Module Purchases (transaction table)

8. **Step 8** — Module Activations (table + detail dialog)

9. **Step 9** — Module Accounting (comptes + pieces)

10. **Step 10** — Module Promo Codes (CRUD)

11. **Step 11** — Module Margins (CRUD)

12. **Step 12** — Module Packages (CRUD)

13. **Step 13** — Barrel + Docs lifecycle
