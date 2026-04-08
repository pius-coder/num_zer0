# Plan: Fix Activation Flow — FK Violation + Grizzly Lifecycle Bugs

## Context

The `activation.service.ts` `request()` method has 3 cascading bugs discovered in production logs:

1. **FK Violation**: `credit_hold.activation_id` references `smsActivation.id`, but the hold is inserted BEFORE the activation row exists → Postgres rejects the INSERT
2. **Missing `setStatus(1)`**: After `getNumberV2()`, the code never calls `setStatus(id, 1)` (ACCESS_READY), violating the GrizzlySMS lifecycle
3. **Wrong cancel code**: The catch block uses `setStatus(id, 8)` (cancel after READY), but since READY was never called, Grizzly returns BAD_ACTION. Should use `-1` (immediate cancel)

## Reference Sources

- `/home/afreeserv/project/grizzly-wrapper-optimization/README.md` — Official wrapper with correct flow
- `/home/afreeserv/project/grizzly-wrapper-optimization/src/types.ts` — SetStatusCode = -1 | 1 | 3 | 6 | 8
- `/home/afreeserv/project/grizzly-wrapper-optimization/src/client.ts` — setStatus implementation
- `/home/afreeserv/project/num_zero/tmp/reference-grizzly/SKILL.md` — MCP skill confirming flow

## Correct Grizzly Lifecycle (from reference)

```
getNumber/getNumberV2  →  setStatus(id, 1)  →  poll getStatus  →  setStatus(id, 6)
                                                                    or setStatus(id, -1) if cancel needed
                                                                    or setStatus(id, 8) if cancel AFTER setStatus(1)
```

## Target Flow (after fix)

```
1. holdCredits(sans activationId)          ← Crédits bloqués, FK pas encore liée
2. grizzly.getNumberV2()                    ← On obtient le numéro + activationId
3. grizzly.setStatus(id, 1)                ← ACCESS_READY : on signale qu'on est prêt
4. db.insert(smsActivation)                 ← FK valide maintenant
5. UPDATE credit_hold SET activation_id     ← On lie le hold à l'activation
6. Si erreur au step 2-5 → grizzly.setStatus(id, -1) + releaseHoldsByIdempotencyKey()
```

---

## TODOs

- [x] T1: Add `releaseHoldsByIdempotencyKey()` method to `credit-ledger.service.ts`
  - Current `releaseHoldByActivationId()` requires `activationId` to be linked in DB
  - New flow holds credits WITHOUT `activationId`, so we need a way to release by idempotency key
  - Add method `releaseHoldsByIdempotencyKey(idempotencyKey: string)` that:
    - Finds all holds where `idempotencyKey LIKE '${idempotencyKey}_%'` AND state = 'held'
    - Restores lot remainingAmount for each hold
    - Marks holds as 'released'
    - Decrements wallet `heldBalance` by total released amount
  - Pattern: same as `releaseHoldByActivationId()` but query by idempotency key prefix instead of activationId

- [x] T2: Add `linkHoldsToActivation()` method to `credit-ledger.service.ts`
  - After inserting `smsActivation`, we need to link the orphaned holds to the activation
  - Add method `linkHoldsToActivation(idempotencyKey: string, activationId: string)` that:
    - Finds all holds where `idempotencyKey LIKE '${idempotencyKey}_%'` AND state = 'held' AND `activationId IS NULL`
    - Updates each hold's `activationId` to the provided value
    - FK is now valid because `smsActivation` row already exists
  - Returns count of linked holds

- [x] T3: Rewrite `activation.service.ts` `request()` method with correct flow
  - Remove `activationId` from `holdCredits()` call (step 1)
  - Keep `grizzly.getNumberV2()` call (step 2)
  - Add `grizzly.setStatus(grizzlyResult.activationId, 1)` — ACCESS_READY after getNumber (step 3)
  - Move `db.insert(smsActivation)` before linking holds (step 4)
  - Call `creditLedger.linkHoldsToActivation(idempotencyKey, activationId)` (step 5)
  - In catch block: replace `grizzly.setStatus(id, 8)` with `grizzly.setStatus(id, -1)` (immediate cancel)
  - In catch block: replace `releaseHoldByActivationId(activationId)` with `releaseHoldsByIdempotencyKey(idempotencyKey)`
  - If Grizzly getNumber fails: call `creditLedger.releaseHoldsByIdempotencyKey(idempotencyKey)` to release held credits
  - If setStatus(1) fails: call `grizzly.setStatus(id, -1)` + `releaseHoldsByIdempotencyKey()`
  - If db.insert fails: call `grizzly.setStatus(id, -1)` + `releaseHoldsByIdempotencyKey()`
  - If linkHolds fails: call `grizzly.setStatus(id, -1)` + `releaseHoldsByIdempotencyKey()` + mark activation as cancelled

- [x] T4: Fix `cancelActivation()` method — use correct cancel codes
  - Current: always uses `grizzly.setStatus(id, 8)` — wrong if activation never received `setStatus(1)`
  - Fix: check activation state:
    - If state is 'waiting' or 'assigned' (never sent READY to Grizzly) → use `setStatus(id, -1)`
    - If state is 'active' (READY was sent) → use `setStatus(id, 8)`
  - Also: `cancelActivation` currently checks `result.raw === 'ACCESS_CANCEL'` but our wrapper returns `{ status: 'ACCESS_CANCEL', raw: 'ACCESS_CANCEL' }` — need to check `result.status === 'ACCESS_CANCEL'` instead

- [x] T5: Add `setStatus(id, -1)` support to `grizzly/activation.ts` types
  - Current `GrizzlySetStatusCode` type already includes `-1` (from types.ts)
  - Verify the `setStatus` function in `activation.ts` handles `-1` correctly
  - Verify the `GrizzlySetStatusResponse` type includes `ACCESS_CANCEL` response for `-1`

---

## Final Verification Wave

- [ ] F1: Oracle review — verify FK constraint is never violated in the new flow
- [ ] F2: Oracle review — verify Grizzly lifecycle is correct per reference wrapper
- [ ] F3: Build passes — `bun run typecheck` + `bun run build`
- [ ] F4: Code review — read every changed file line by line, verify logic

---

## Files to Modify

| File | Change |
|------|--------|
| `src/services/credit-ledger.service.ts` | Add `releaseHoldsByIdempotencyKey()`, add `linkHoldsToActivation()` |
| `src/services/activation.service.ts` | Rewrite `request()`, fix `cancelActivation()` |
| `src/services/grizzly/types.ts` | Verify `-1` status code is supported (likely already is) |
| `src/services/grizzly/activation.ts` | Verify `-1` cancel works (likely already does) |

## Files NOT to Modify

- Database schema (no migration needed — `activation_id` is already nullable)
- `credit_hold` table structure
- Any other service files
- Any frontend/component files

## Key Constraints

- `credit_hold.activation_id` is **nullable** (schema line 111: `references(() => smsActivation.id)` without `.notNull()`)
- This means holding credits WITHOUT activationId is valid at the DB level
- The FK only matters when we LINK the activationId later — at that point, smsActivation must exist
- `releaseHoldByActivationId()` still works for the `cancelActivation()` flow (activation is linked by then)
- The new `releaseHoldsByIdempotencyKey()` is needed only for the `request()` catch path (before linking)
