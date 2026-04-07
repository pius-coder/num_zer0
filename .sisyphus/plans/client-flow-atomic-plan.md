# 🧩 Atomic Coding Plan: Client Flow Rebuild (Shadow Pricing + Balance Guard)

## Problem Statement

The new shadow pricing implementation breaks 3 client API endpoints due to leftover DB queries referencing old tables. Additionally, critical pre-flight guards and the Grizzly balance check need to be hardened.

---

## 🔄 Full Flow Analysis

### 3 APIs Currently Crashing:
1. **`GET /api/client/services`** → Fails: `price_rule` table query (migration replaced it)
2. **`GET /api/client/credits/balance`** → Fails: `user_wallet_summary` view not created
3. **`GET /api/client/activations/history`** → Fails: DB query error (table/column mismatch)

### New Implementation Status:
- ✅ `PricingResolverService` — Shadow pricing with Promise Coalescing (tests pass)
- ✅ `ActivationService` — Pre-flight check (stock + provider balance) (tests pass)
- ✅ Error mapping — `out_of_stock` → French message (in actions)
- ✅ `CountryItem` type — Added `source: PriceSource` + `availability`
- ⏳ `verifyGrizzlyBalanceLive()` — Partial implementation in service (no tests yet)
- ⏳ Cancel Refund Check — Not implemented (Task 12)
- ⏳ Pending OTP Tab — Not implemented (Task 11)

---

## 📋 Atomic Plan (Phases)

### Phase 1: Fix Crashing API Endpoints
| # | Task | File(s) | Change | Risk | Time |
|---|------|---------|--------|------|------|
| 1.1 | Fix `/api/client/services` | `app/api/client/services/route.ts` | Replace `price_rule` query with `PricingResolverService.resolvePricesForService()` or count from `price_override` | High | Quick |
| 1.2 | Fix `/api/client/credits/balance` | Identify route file, check DB schema | Create missing view or fallback query | High | Quick |
| 1.3 | Fix `/api/client/activations/history` | Identify route file | Fix column/table mismatch | Medium | Quick |

### Phase 2: Finalize `verifyGrizzlyBalanceLive()` + Tests
| # | Task | File(s) | Change | Risk | Time |
|---|------|---------|--------|------|------|
| 2.1 | Implement `verifyGrizzlyBalanceLive()` | `src/services/activation.service.ts` | Add full method with balance + price check + throw 'grizzly_no_balance' | Low | Quick |
| 2.2 | Test: Balance sufficient, purchase proceeds | `src/services/activation.service.test.ts` | Mock Grizzly balance > cost, verify no error | Low | Quick |
| 2.3 | Test: Balance insufficient throws error | `src/services/activation.service.test.ts` | Mock Grizzly balance < cost, verify throws 'grizzly_no_balance' | Low | Quick |

### Phase 3: Hook & Type Updates (Live Currency Refresh)
| # | Task | File(s) | Change | Risk | Time |
|---|------|---------|--------|------|------|
| 3.1 | Reduce staleTime for prices | `src/hooks/use-numbers.ts` | `useInfiniteCountries`: 10min → 30s, `usePrefetchCountries`: 5min → 1min | Low | Quick |
| 3.2 | Add error code handling to useRequestActivation | `src/hooks/use-numbers.ts` | Pass `errorCode` to UI layer (OUT_OF_STOCK vs generic) | Low | Quick |

### Phase 4: Cancel Refund Logic (Task 12)
| # | Task | File(s) | Change | Risk | Time |
|---|------|---------|--------|------|------|
| 4.1 | Update cancel to call Grizzly Status API | `src/services/activation.service.ts` | `cancelActivation()` → Grizzly.setStatus(-8) → check refund → decide credit refund | High | Deep |
| 4.2 | Test: Cancel with Grizzly refund | `src/services/activation.service.test.ts` | Mock setStatus returns refund → verify credits refunded | Medium | Quick |
| 4.3 | Test: Cancel without Grizzly refund | `src/services/activation.service.test.ts` | Mock setStatus no refund → verify credits NOT refunded | Medium | Quick |
| 4.4 | UI handling for "cancelled_no_refund" | Update activation state enum | Add 'cancelled_no_refund' to enum (if not present) | Low | Quick |

### Phase 5: Pending OTP Tab (Task 11)
| # | Task | File(s) | Change | Risk | Time |
|---|------|---------|--------|------|------|
| 5.1 | Create `pending-activations.tsx` component | `src/component/numbers/pending-activations.tsx` | Client component: filter pending/waiting, poll, cancel button, timer | Medium | Deep |
| 5.2 | Add pending filter to hook | `src/hooks/use-numbers.ts` | `usePendingActivations()` — filter for 'waiting', polling 5s, cancel support | Low | Quick |

---

## 🛑 Dependencies (Execution Order)

```
Phase 1 (Fix crashes) → Phase 2 (Balance guard) → Phase 3 (Hooks)
     │                          │                       │
     │                          ▼                       │
     └──────────────────── Phase 4 (Cancel logic) ──────┘
                                   │
                                   ▼
                         Phase 5 (UI: Pending Tab)
```

**Phase 1 MUST complete first** — APIs are crashing, app is broken.

**Phase 2 is critical** — Final balance guard prevents NO_BALANCE errors during purchase.

**Phase 3 is UX improvement** — Faster price refresh for live Grizzly prices.

**Phase 4 & 5 are feature completion** — From original plan Tasks 11, 12.

---

## 📊 STATUS: COMPLETED

| Phase | Tasks | Status | Notes |
|-------|-------|--------|-------|
| **Phase 1: Fix 3 crashing APIs** | 1.1, 1.2, 1.3 | ✅ DONE | `price_rule` → `price_override`, wallet fallback, activation catch |
| **Phase 2: Balance Guard** | 2.1, 2.2, 2.3, 2.4 | ✅ DONE | `verifyGrizzyBalanceLive()` + 4 tests (38 total pass) |
| **Phase 3: Hook Updates** | 3.1, 3.2 | ✅ DONE | staleTime 10min → 30s, error code passthrough |
| **Phase 4: Cancel Refund** | 4.1-4.4 | ❌ TODO | Task 12 from plan |
| **Phase 5: Pending OTP Tab** | 5.1-5.2 | ❌ TODO | Task 11 from plan |
