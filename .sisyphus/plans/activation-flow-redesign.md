# Plan: Activation Flow Redesign — Banking-Level Credit Holds

## TL;DR

> **Quick Summary**: Redesigner le flow d'activation SMS pour eliminer le chicken-and-egg FK bug en insérant smsActivation EN PREMIER (state='requested'), puis hold credits avec activationId valide, puis appeler Grizzly, puis updater l'activation. Pattern banking-level avec sous-services, try/catch a chaque etape, et logging structure.
> 
> **Deliverables**:
> - credit-ledger.service.ts refactoré: holdCredits() avec activationId REQUIRED, Drizzle INSERT, supprimer linkHoldsToActivation()
> - activation.service.ts refactoré: nouveau flow INSERT-first avec 5 sous-services
> - Migration Postgres: ALTER COLUMN activation_id SET NOT NULL (corriger le desync)
> - Tests mis a jour
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (migration) → Task 2 (credit-ledger) → Task 3 (activation.service) → Task 4 (tests) → Task 5 (smoke test)

---

## Context

### Original Request
Bug prod: FK violation sur credit_hold.activation_id. Le code holdCredits() passe NULL via raw SQL car l'activation n'existe pas encore. User veut un rethink complet du flow avec pattern banking-level.

### Interview Summary
**Key Discussions**:
- User a EXPLICITEMENT refuse nullable sur activation_id: "impossible dont set it nullable"
- User veut des sous-services: "parser tout cela en sous service afin d'appeler les services concernes a chaque etape et des try catch et auto report les erreurs et notre system de logs"
- User veut Drizzle INSERT (pas raw SQL) dans holdCredits()
- User veut supprimer linkHoldsToActivation() — plus necessaire

**Research Findings**:
- Desync Drizzle schema (.notNull()) vs Postgres (nullable en DB) — la migration initiale n'a pas mis NOT NULL
- get_consumable_lots() est une fonction PG FIFO avec FOR UPDATE row-level locking
- cleanup_expired_holds() existe en PG function
- activationStateEnum a deja 'requested' comme valeur
- Le webhook grizzly utilise deja releaseHoldByActivationId() et confirmHoldDebit()

### Metis Review
**Identified Gaps** (addressed):
- Race condition si DELETE activation en rollback mais le cron cleanup_expired_holds() tourne en meme temps → Guardrail: DELETE activation avec CASCADE sur credit_hold, les holds sont auto-supprimés
- Que faire si l'UPDATE final (step 7) echoue? → Default: leave as 'requested' + cleanup_expired_holds() cron le nettoie
- Le webhook grizzly cherche par providerActivationId — si l'activation est en state='requested' sans providerActivationId, le webhook ne la trouvera pas → OK, pas de webhook tant qu'on a pas appelé Grizzly
- releaseHoldsByIdempotencyKey() est encore utilisee dans le cancel flow? → NON, cancelActivation() utilise deja releaseHoldByActivationId(). releaseHoldsByIdempotencyKey() peut etre garde pour le fallback mais le nouveau flow ne l'utilise plus
- Migration ALTER COLUMN SET NOT NULL va echouer si il y a des rows existants avec activation_id=NULL → Guardrail: d'abord UPDATE les rows NULL existants, puis ALTER COLUMN

---

## Work Objectives

### Core Objective
Eliminer le chicken-and-egg FK bug en insérant smsActivation EN PREMIER (state='requested'), puis hold credits avec activationId valide, puis appeler Grizzly, puis updater l'activation. Pattern banking-level avec rollback clean a chaque etape.

### Concrete Deliverables
- `src/services/credit-ledger.service.ts` — holdCredits() avec activationId REQUIRED + Drizzle INSERT, supprimer linkHoldsToActivation()
- `src/services/activation.service.ts` — Nouveau flow INSERT-first avec 5 sous-services
- `drizzle/migrations/` — Nouvelle migration pour corriger le desync Postgres
- `src/services/activation.service.test.ts` — Tests mis a jour

### Definition of Done
- [ ] `bun test src/services/activation.service.test.ts` → PASS
- [ ] Aucun raw SQL dans holdCredits() — Drizzle INSERT uniquement
- [ ] linkHoldsToActivation() supprimé du codebase
- [ ] Migration appliquée: `activation_id` est NOT NULL en Postgres ET Drizzle
- [ ] Smoke test: service=wa, country=41 → activation créée en state='requested' puis 'waiting'

### Must Have
- activation_id NOT NULL dans credit_hold (Drizzle schema ET Postgres)
- Nouveau flow INSERT-first complet dans activation.service.request()
- holdCredits() avec activationId: string REQUIRED
- Drizzle INSERT dans holdCredits() (pas raw SQL)
- Try/catch avec rollback a chaque etape
- Logging structure a chaque sous-service
- Supprimer linkHoldsToActivation()

### Must NOT Have (Guardrails)
- PAS de nullable/default sur activation_id dans credit_hold schema
- PAS de raw SQL dans holdCredits() pour l'INSERT
- PAS de linkHoldsToActivation() — plus necessaire
- PAS de .default('PENDING') sur activationId
- PAS de changement au webhook grizzly (il utilise deja releaseHoldByActivationId)
- PAS de changement au cancel flow (il utilise deja releaseHoldByActivationId)
- PAS de changement a l'API route ou au server action (ils deleguent a ActivationService.request())
- PAS de console.log — utiliser le systeme de logs structure (this.log)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: YES (tests-after)
- **Framework**: bun test
- **If TDD**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun test) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Migration Postgres - corriger desync activation_id NOT NULL [quick]
└── Task 2: Refaire credit-ledger.service.ts - holdCredits REQUIRED + Drizzle INSERT [deep]

Wave 2 (After Wave 1 - core flow):
├── Task 3: Refaire activation.service.ts - nouveau flow INSERT-first [deep]
└── Task 4: Supprimer linkHoldsToActivation() + nettoyer references [quick]

Wave 3 (After Wave 2 - verification):
└── Task 5: Smoke test reel + mise a jour tests [unspecified-high]

Wave FINAL (After ALL tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 2 → Task 3 → Task 5 → F1-F4
Parallel Speedup: ~40% faster than sequential
Max Concurrent: 2 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 2, 3 |
| 2 | 1 | 3 |
| 3 | 1, 2 | 4, 5 |
| 4 | 3 | 5 |
| 5 | 3, 4 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 2 agents — T1 → `quick`, T2 → `deep`
- **Wave 2**: 2 agents — T3 → `deep`, T4 → `quick`
- **Wave 3**: 1 agent — T5 → `unspecified-high`
- **FINAL**: 4 agents — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Migration Postgres — corriger desync activation_id NOT NULL

  **What to do**:
  - Creer une migration SQL qui:
    1. UPDATE credit_hold SET activation_id = 'orphan_cleanup' WHERE activation_id IS NULL (nettoyer les rows existants avec NULL)
    2. ALTER TABLE credit_hold ALTER COLUMN activation_id SET NOT NULL
  - Verifier que le schema Drizzle dans `src/database/schemas/credits.ts` a deja activationId: text('activation_id').notNull() — il ne faut PAS le changer, il est deja correct
  - Verifier avec `SELECT count(*) FROM credit_hold WHERE activation_id IS NULL` qu'il n'y a pas de rows NULL restants avant le ALTER
  - Si des rows orphelins existent avec activation_id=NULL, les supprimer ou les marquer comme 'expired' car ils sont le resultat du bug

  **Must NOT do**:
  - Ne PAS changer le schema Drizzle (il est deja correct avec .notNull())
  - Ne PAS ajouter .default('PENDING') ou .nullable()
  - Ne PAS supprimer les credit_hold legitimes (seulement les orphelins NULL)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single SQL migration file, straightforward DB operation
  - **Skills**: [`postgres-patterns`]
    - `postgres-patterns`: Database migration patterns and best practices

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/database/schemas/credits.ts:111-113` — credit_hold.activationId is .notNull() in Drizzle schema (CORRECT, don't change)
  - `drizzle/migrations/0000_initial.sql:522` — Migration initiale qui cree la FK SANS NOT NULL (le bug originel)
  - `drizzle/migrations/0001_optimization.sql` — Pattern de migration existant (indexes, views, functions)

  **API/Type References**:
  - `src/database/schemas/credits.ts:101-130` — creditHold table definition with all columns and indexes

  **WHY Each Reference Matters**:
  - `credits.ts:111-113` — Confirms the Drizzle schema is already correct (.notNull()), only Postgres needs fixing
  - `0000_initial.sql:522` — Shows the root cause: original migration missed NOT NULL constraint
  - `0001_optimization.sql` — Example of how this project structures SQL migrations

  **Acceptance Criteria**:

  - [ ] Migration SQL file created in drizzle/migrations/
  - [ ] Migration handles existing NULL rows (UPDATE or DELETE before ALTER)
  - [ ] After migration: `SELECT count(*) FROM credit_hold WHERE activation_id IS NULL` returns 0
  - [ ] After migration: `SELECT is_nullable FROM information_schema.columns WHERE table_name='credit_hold' AND column_name='activation_id'` returns 'NO'

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify migration handles NULL rows
    Tool: Bash (psql/direct SQL)
    Preconditions: Database connection available
    Steps:
      1. Run `SELECT count(*) FROM credit_hold WHERE activation_id IS NULL` before migration
      2. Apply migration
      3. Run `SELECT count(*) FROM credit_hold WHERE activation_id IS NULL` after migration
      4. Run `SELECT is_nullable FROM information_schema.columns WHERE table_name='credit_hold' AND column_name='activation_id'`
    Expected Result: Step 3 returns 0, Step 4 returns 'NO'
    Failure Indicators: Step 3 returns >0 or Step 4 returns 'YES'
    Evidence: .sisyphus/evidence/task-1-migration-not-null.txt

  Scenario: Migration fails gracefully on constraint violation
    Tool: Bash (psql/direct SQL)
    Preconditions: Rows with activation_id=NULL still exist and are not cleaned up
    Steps:
      1. Attempt ALTER COLUMN SET NOT NULL without cleanup
      2. Observe error message
    Expected Result: PostgreSQL returns error "contains null values"
    Failure Indicators: ALTER succeeds without cleanup step (would mean no NULL rows exist)
    Evidence: .sisyphus/evidence/task-1-migration-error-case.txt
  ```

  **Commit**: YES
  - Message: `fix(db): add migration to set activation_id NOT NULL in credit_hold`
  - Files: `drizzle/migrations/0002_activation_id_not_null.sql`
  - Pre-commit: `bun run db:generate`

- [x] 2. Refaire credit-ledger.service.ts — holdCredits REQUIRED + Drizzle INSERT
- [x] 3. Refaire activation.service.ts — nouveau flow INSERT-first
- [x] 4. Supprimer linkHoldsToActivation() + nettoyer references

  **What to do**:
  - Changer la signature de holdCredits(): `activationId?: string` → `activationId: string` (REQUIRED)
  - Remplacer le raw SQL INSERT dans holdCredits() par Drizzle INSERT:
    ```typescript
    await tx.insert(creditHold).values({
      id: this.generateId('hold'),
      userId: params.userId,
      walletId: wallet.id,
      activationId: params.activationId,  // REQUIRED, plus de null
      amount: lot.consumeAmount,
      creditType: realLot.creditType,
      lotId: lot.lotId,
      state: 'held',
      expiresAt: nowPlusMinutes(params.holdTimeMinutes),
      idempotencyKey: `${params.idempotencyKey}_${lot.lotId}`,
    })
    ```
  - Garder l'idempotency check au debut de holdCredits() (si des holds existent deja pour cet activationId, skip)
  - Garder `this.transaction()` wrapper pour l'atomicite
  - Garder `get_consumable_lots()` call (c'est du raw SQL pour FIFO mais c'est un SELECT, pas un INSERT)
  - Ajouter logging structure: `this.log.info('credits_held', { activationId, userId, amount })` a la fin
  - Garder `releaseHoldByActivationId()` et `confirmHoldDebit()` — ils sont utilises par le webhook
  - Garder `releaseHoldsByIdempotencyKey()` — encore utile comme fallback meme si le nouveau flow ne l'utilise plus
  - SUPPRIMER `linkHoldsToActivation()` (voir Task 4 pour le nettoyage complet)

  **Must NOT do**:
  - Ne PAS utiliser raw SQL pour l'INSERT de credit_hold
  - Ne PAS rendre activationId optional
  - Ne PAS utiliser .default() ou .nullable() sur activationId
  - Ne PAS modifier releaseHoldByActivationId(), confirmHoldDebit(), ou releaseHoldsByIdempotencyKey()
  - Ne PAS modifier getBalance() ou creditWallet()

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex service refactor with Drizzle INSERT migration and multiple method interactions
  - **Skills**: [`postgres-patterns`, `coding-standards`]
    - `postgres-patterns`: Database query patterns with Drizzle
    - `coding-standards`: TypeScript best practices

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately, but migration should be applied before testing)

  **References**:

  **Pattern References**:
  - `src/services/credit-ledger.service.ts:137-233` — Current holdCredits() with raw SQL INSERT (TO BE REPLACED)
  - `src/services/credit-ledger.service.ts:40-47` — Example of Drizzle INSERT pattern in getOrCreateWallet()
  - `src/services/credit-ledger.service.ts:432-499` — Example of Drizzle INSERT pattern in creditWallet() with transaction
  - `src/services/base.service.ts:425-442` — transaction() helper with logging

  **API/Type References**:
  - `src/database/schemas/credits.ts:101-130` — creditHold table schema (activationId is .notNull())
  - `src/database/schemas/enums.ts:18-23` — creditHoldStateEnum: 'held', 'debited', 'released', 'expired'

  **Test References**:
  - `src/services/activation.service.test.ts` — Existing tests that call holdCredits()

  **WHY Each Reference Matters**:
  - `credit-ledger.service.ts:137-233` — This is the EXACT code to replace (raw SQL → Drizzle INSERT)
  - `credit-ledger.service.ts:40-47` — Pattern to follow for Drizzle INSERT: `this.db.insert(table).values({...})`
  - `credit-ledger.service.ts:432-499` — Shows how to do multi-row INSERT inside a transaction with proper wallet updates
  - `base.service.ts:425-442` — Shows the transaction() wrapper pattern with debug/error logging
  - `credits.ts:101-130` — Confirms the schema columns and types for the INSERT values

  **Acceptance Criteria**:

  - [ ] holdCredits() signature: `activationId: string` (REQUIRED, pas optional)
  - [ ] Zero raw SQL INSERT in holdCredits() — Drizzle INSERT only
  - [ ] get_consumable_lots() call still works (it's a SELECT, not INSERT)
  - [ ] Idempotency check preserved: if holds exist for activationId, return early
  - [ ] `bun test src/services/activation.service.test.ts` → PASS (after Task 3 is also done)
  - [ ] TypeScript compiles: `npx tsc --noEmit` → no errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: holdCredits with REQUIRED activationId succeeds
    Tool: Bash (bun test)
    Preconditions: Test database available, wallet exists with credits
    Steps:
      1. Call holdCredits({ userId: 'test_user', amount: 100, holdTimeMinutes: 20, activationId: 'act_test123', idempotencyKey: 'key1' })
      2. Query credit_hold table for activation_id = 'act_test123'
      3. Verify hold exists with state='held'
    Expected Result: Hold created successfully with correct activationId
    Failure Indicators: TypeScript error on missing activationId, or DB insert fails
    Evidence: .sisyphus/evidence/task-2-holdcredits-required.txt

  Scenario: holdCredits WITHOUT activationId fails TypeScript compilation
    Tool: Bash (npx tsc)
    Preconditions: Modified holdCredits() with required activationId
    Steps:
      1. Attempt to call holdCredits({ userId: 'test', amount: 100, holdTimeMinutes: 20, idempotencyKey: 'key1' }) without activationId
      2. Run tsc --noEmit
    Expected Result: TypeScript error "Property 'activationId' is missing"
    Failure Indicators: Code compiles without error (means activationId is still optional)
    Evidence: .sisyphus/evidence/task-2-typescript-required.txt
  ```

  **Commit**: YES
  - Message: `refactor(credits): holdCredits with REQUIRED activationId + Drizzle INSERT`
  - Files: `src/services/credit-ledger.service.ts`
  - Pre-commit: `npx tsc --noEmit`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `fix(db): add migration to set activation_id NOT NULL in credit_hold` - drizzle/migrations/*.sql
- **Task 2**: `refactor(credits): holdCredits with REQUIRED activationId + Drizzle INSERT` - src/services/credit-ledger.service.ts
- **Task 3**: `refactor(activation): INSERT-first flow with banking-level rollback` - src/services/activation.service.ts
- **Task 4**: `chore(credits): remove linkHoldsToActivation - no longer needed` - src/services/credit-ledger.service.ts
- **Task 5**: `test(activation): update tests for INSERT-first flow` - src/services/activation.service.test.ts

---

## Success Criteria

### Verification Commands
```bash
bun test src/services/activation.service.test.ts  # Expected: all tests pass
bun run db:generate                                # Expected: migration generated
npx tsc --noEmit                                   # Expected: no type errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Migration applied successfully
- [ ] holdCredits() uses Drizzle INSERT (no raw SQL)
- [ ] linkHoldsToActivation() removed from codebase
- [ ] activation_id NOT NULL in both Drizzle schema and Postgres
