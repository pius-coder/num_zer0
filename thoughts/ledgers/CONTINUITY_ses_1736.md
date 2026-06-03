---
session: ses_1736
updated: 2026-06-03T08:29:02.125Z
---

# Session Summary

## Goal
Create a batch-parallel implementation plan at `thoughts/shared/plans/2026-06-03-security-hardening-plan.md` covering all 15 checklist items from the security hardening design, respecting the 200-line-per-file limit and Convex conventions.

## Constraints & Preferences
- Convex-first — all fixes must work within Convex's mutation/query/action model and serializable isolation guarantees
- No new external npm packages
- Backward-compatible — no breaking changes to existing client API signatures
- Minimal migration — schema changes must be additive only (widen, don't narrow)
- Each micro-task = one file change + its verification
- 200-line-per-file limit enforced by ESLint `max-lines`
- Project at `/home/afreeserv/projects/num_zer0/`
- Test files follow pattern from `src/__tests__/convex/sms_countries.test.ts` (vitest, direct imports from `convex/`)

## Progress
### Done
- [x] Read full design document at `thoughts/shared/designs/2026-06-03-pre-deployment-security-hardening-design.md`
- [x] Read all 7 source files (`auth.ts`, `users.ts`, `comptabilite.ts`, `purchases.ts`, `analytics.ts`, `sms_provider.ts`, `schema.ts`) to understand current code
- [x] Grepped for `balanceUsd` across codebase — found 20 references (8 in Convex, 12 in frontend/src)
- [x] Analyzed dependency graph for all 15 checklist items across 8 file changes
- [x] Designed each micro-task with complete code, test file, and commit message
- [x] Created `thoughts/shared/plans/` directory

### In Progress
- [ ] Writing the full plan file at `thoughts/shared/plans/2026-06-03-security-hardening-plan.md` — WRITE FAILED with JSON parse error (content exceeded string limit). Plan is partially designed but not yet persisted to disk.

### Blocked
- The plan content was too large for a single `write` tool call (~42KB+). Need to split into segments or use a different approach to write the file.

## Key Decisions
- **Batch structure (4 batches, parallel within batch)**: Batch 1 (Foundation: auth-helpers, schema, auth.ts — 3 parallel), Batch 2 (Core: users, comptabilite, analytics — 3 parallel), Batch 3 (Complex: purchases, sms_provider — 2 parallel), Batch 4 (Verification — sequential). This maximizes parallelism while respecting dependency chains.
- **`trackEvent` whitelist**: Defined 6 allowed types from existing usage — `click_buy`, `click_services`, `page_leave`, `page_view`, `phone_country_selected`, `service_selected`.
- **`internalPatchPurchase` typed patch**: Using `v.object({status: v.optional(v.string()), paymentGatewayId: v.optional(v.string()), failureReason: v.optional(v.string()), failedAt: v.optional(v.number())})`.
- **Reference naming pattern**: `payment-{purchaseId}` for payments, `escrow-{activationId}` for escrow setup, `refund-{activationId}` for refunds, `complete-{activationId}` for completions.
- **`getNumberQuantity`/`getTopCountries` rate limiting**: Only `requireAuth` guard implemented (not DB-backed rate limiting) — Convex queries can't write, and the SMS provider handles its own server-side rate limiting.
- **Promo race fix**: Remove `internalIncrementPromo` from `initiateDirectPay` (before Fapshi API call), move to `applyPaymentCredit` (atomic with payment confirmation), add `internalDecrementPromo` rollback.
- **`debitCompte` overdraft protection**: Check `compte.solde < args.montant` before patching, throw `ConvexError` with balance details.
- **`balanceUsd` cleanup**: Phase A only (stop writing the field in mutations: `auth.ts:53`, `users.ts:107`, `purchases.ts:103`, `purchases.ts:264`). The schema field stays for Phase B. Frontend `balanceData?.balanceUsd` reads from `comptes.solde` query return key, not the DB field — no frontend changes needed.

## Next Steps
1. Write the plan file in segments (or use a single large write with escaped content) — the full plan needs to be ~42KB+ with complete code for all 8 micro-tasks
2. Execute Batch 1: Create `convex/lib/auth-helpers.ts`, modify `convex/schema.ts`, modify `convex/auth.ts` (3 parallel implementers)
3. Execute Batch 2: Modify `convex/users.ts`, `convex/comptabilite.ts`, `convex/analytics.ts` (3 parallel — depends on Batch 1)
4. Execute Batch 3: Modify `convex/purchases.ts`, `convex/sms_provider.ts` (2 parallel — depends on Batch 2)
5. Execute Batch 4: `npx convex dev`, `bun run typecheck`, `bun run build`, run all tests

## Critical Context
- The plan file MUST be written to `/home/afreeserv/projects/num_zer0/thoughts/shared/plans/2026-06-03-security-hardening-plan.md`
- Current import patterns in Convex files: `import { query, mutation, internalMutation, ... } from './_generated/server'`, `import { v } from 'convex/values'`, `import { internal } from './_generated/api'`
- `convex/purchases.ts` (493 lines) and `convex/sms_provider.ts` (600 lines) are already over the 200-line limit — surgical additions only
- `syncUser` in `convex/auth.ts` calls `api.users.syncUser` on line 60 — needs to change to `internal.users.syncUser` when syncUser becomes internalMutation
- `convex/auth.ts` has inline `syncUserDb` function (lines 16-57) doing the actual work — the `runMutation(api.users.syncUser)` is a fallback
- `convex/sms_provider.ts` uses `filter()` for reference lookups (lines 328-331, 375-379) instead of `withIndex()` — all reference lookups must be converted to use the new `by_reference` index

## File Operations
### Read
- `/home/afreeserv/projects/num_zer0/convex` (directory listing)
- `/home/afreeserv/projects/num_zer0/convex/analytics.ts` (22 lines + ~150 lines)
- `/home/afreeserv/projects/num_zer0/convex/auth.ts` (full file, ~110 lines)
- `/home/afreeserv/projects/num_zer0/convex/comptabilite.ts` (full file, ~223 lines)
- `/home/afreeserv/projects/num_zer0/convex/purchases.ts` (full file, ~493 lines)
- `/home/afreeserv/projects/num_zer0/convex/sms_provider.ts` (full file, ~600 lines)
- `/home/afreeserv/projects/num_zer0/convex/schema.ts` (full schema definition)
- `/home/afreeserv/projects/num_zer0/convex/users.ts` (full file, ~279 lines)
- `/home/afreeserv/projects/num_zer0/src/__tests__/convex/sms_countries.test.ts` (test pattern reference)
- `/home/afreeserv/projects/num_zer0/thoughts/shared/designs/2026-06-03-pre-deployment-security-hardening-design.md` (design document)

### Modified
- `/home/afreeserv/projects/num_zer0/thoughts/shared/plans/2026-06-03-security-hardening-plan.md` — **WRITE FAILED** (content too large, JSON parse error). The file does not exist yet on disk.
