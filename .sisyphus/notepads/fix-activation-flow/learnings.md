## 2026-04-08 Initial Diagnosis

### Root Cause Chain
1. `holdCredits({ activationId })` → FK violation (smsActivation doesn't exist yet)
2. Missing `setStatus(id, 1)` after `getNumberV2()` → Grizzly lifecycle violated
3. `setStatus(id, 8)` in catch → BAD_ACTION (should be `-1` for immediate cancel)

### Key Schema Findings
- `credit_hold.activation_id` is NULLABLE — safe to hold without it
- FK only enforced when `activation_id` is non-null
- `idempotencyKey` format: `{inputKey}_{lotId}` — prefix matchable with LIKE

### Grizzly Reference Flow (from grizzly-wrapper-optimization)
```
getNumber → setStatus(1) → poll → setStatus(6|8|-1)
-1 = immediate cancel (before READY)
 8 = cancel after READY
 1 = ACCESS_READY (mandatory after getNumber)
 6 = complete
```
