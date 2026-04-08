## 2026-04-08 Architecture Decision

### Flow order: hold → getNumber → setStatus(1) → insert activation → link holds

**Why this order:**
1. Hold credits FIRST → ensures user can afford before calling Grizzly (saves Grizzly $ if insufficient)
2. Get number from Grizzly → we need the phone number for the activation record
3. setStatus(1) → mandatory per Grizzly API before any further operations
4. Insert smsActivation → FK constraint satisfied (smsActivation exists before credit_hold links to it)
5. Link holds → UPDATE credit_hold SET activation_id WHERE idempotency_key LIKE prefix

**Why NOT insert smsActivation first:**
- We don't have the phone number yet (need Grizzly response)
- We'd need a "pending" state with no phoneNumber, then update later → more complex

**Why NOT hold with activationId (current broken approach):**
- FK constraint: credit_hold.activation_id references smsActivation.id
- smsActivation doesn't exist when holdCredits is called → FK violation
