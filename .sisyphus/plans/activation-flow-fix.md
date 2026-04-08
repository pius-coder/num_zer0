# Fix Activation Flow — Number Display & Sheet UX

## TL;DR

> **Quick Summary**: Fix the broken "Demandé" status card after number purchase by adding proper "waiting for SMS" view with copyable number, Grizzly cancel detection via `getStatus()` v1, a 5-min cancel cooldown button, and a custom Activation Sheet (CountryDrawer pattern) that replaces ConfirmDialog.
> 
> **Deliverables**:
> - ActivationSheet component (Custom Sheet with CSS transforms, replacing ConfirmDialog)
> - Cancel detection via Grizzly `getStatus()` v1 API
> - Cancel button with 5-minute server-side cooldown
> - Copyable phone number in waiting state
> - Proper state transitions: `requested → waiting` (no "Demandé" card)
> - `timerExpiresAt` exposed to frontend for cooldown calculation
> 
> **Estimated Effort**: Medium (touches service layer, hooks, API routes, and multiple UI components)
> **Parallel Execution**: YES - 5 waves with 2-3 tasks each
> **Critical Path**: Task 1 → Task 5 → Task 9 → Task 10 → Task 12

---

## Context

### Original Request
User reported that after purchasing a number, the "Demandé" status card appears instead of the proper "waiting for SMS" experience. They also want: cancel detection (via Grizzly), a cancel button with 5-min cooldown, a copyable phone number, and an activation details Sheet (like CountryDrawer pattern).

### Interview Summary
**Key Discussions**:
- Sheet pattern: User chose Custom Sheet (CSS transforms, like CountryDrawer) over Radix Sheet
- Purchase flow: Sheet replaces ConfirmDialog entirely; confirm step becomes a mini-step inside the Sheet
- Cancel button: Disabled for 5 minutes (Grizzly cooldown), no visible countdown, just a timer that enables the button
- Cancel detection: Check Grizzly `getStatus()` v1 for `STATUS_CANCEL`; users don't access Grizzly directly
- Number display: Must be copyable immediately after purchase, no "Demandé" state

**Research Findings**:
- `getStatus()` v1 returns text statuses including `STATUS_CANCEL` — this is the ONLY way to detect cancellation
- `getStatusV2()` returns JSON but does NOT include cancel status
- `timerExpiresAt` exists in DB schema but is NOT exposed to frontend
- CountryDrawer uses CSS `translate-y-full` / `translate-y-0` transitions
- Current app only polls with `getStatusV2()`, missing cancel detection entirely
- App calls `setStatus(id, 1)` immediately after `getNumberV2`, so Grizzly cancel code 8 applies

### Metis Review
**Identified Gaps** (addressed):
- **Error handling during state transition**: What if Grizzly is slow? → Added 10s timeout with error fallback
- **Sheet lifecycle on close/refresh**: What happens? → Sheet state persists via activation ID; on refresh, list shows current state
- **Cancel button re-enable**: Should re-enable after 5 min even if activation still active → Yes, per user decision
- **getStatus v1 error handling**: Need retry logic → Added silent retry with exponential backoff, show stale state on failure
- **Race condition (cancel + SMS arrive)**: → Cancel fails gracefully, show SMS received state
- **Multiple tabs**: → Polling from each tab is acceptable (existing pattern, no broadcast channel needed for v1)
- **Client clock drift for cooldown**: → Use `timerExpiresAt` from server, calculate delta on frontend
- **Status mismatch (v1 vs v2)**: → v1 is source of truth for cancel; v2 for SMS data; merge: cancelled from v1 wins

## Work Objectives

### Core Objective
Fix the activation flow UX so that after purchasing a number, users immediately see the "waiting for SMS" view with a copyable phone number, cancellation detection via Grizzly `getStatus()` v1, a cancel button with 5-minute cooldown, and a details Sheet following the CountryDrawer pattern.

### Concrete Deliverables
- `src/services/grizzly/activation.ts` — Add `getStatus()` v1 method
- `src/services/grizzly/client.ts` — Expose `getStatus()` v1 on client
- `src/services/grizzly/types.ts` — Add `ActivationStatusV1` type
- `src/services/activation.service.ts` — Add cancel detection method, fix state transitions
- `src/hooks/use-numbers.ts` — Add cancel detection polling, expose `timerExpiresAt`
- `src/type/activation.ts` — Add `timerExpiresAt` to `ActivationInfo`
- `app/api/client/activations/[id]/route.ts` — Expose `timerExpiresAt`, add v1 status check endpoint
- `src/component/numbers/activation-sheet.tsx` — NEW: Custom Sheet component
- `src/component/numbers/activation-sheet.module.css` — NEW: Sheet styles
- `src/component/numbers/active-activation-card.tsx` — Add Sheet open handler, fix state transitions
- `src/component/numbers/my-space-orchestrator.tsx` — Wire Sheet into orchestration

### Definition of Done
- [ ] After purchase, "waiting for SMS" view shows immediately with copyable number (no "Demandé" card)
- [ ] Cancel detection works: `getStatus()` v1 detects `STATUS_CANCEL` within 2 poll cycles
- [ ] Cancel button disabled for exactly 5 minutes from `timerExpiresAt`, then enabled
- [ ] Clicking activation card opens ActivationSheet
- [ ] `bun run build` succeeds with no TypeScript errors
- [ ] No console errors in browser during normal flow

### Must Have
- Custom Sheet following CountryDrawer pattern (CSS transforms, NOT Radix)
- Cancel detection via Grizzly `getStatus()` v1 (returns `STATUS_CANCEL`)
- Cancel button with 5-min server-side cooldown (no visible countdown)
- Copyable phone number with country code in waiting state
- Direct transition from purchase to "waiting for SMS" (no "Demandé" state in UI)

### Must NOT Have (Guardrails)
- NO visible countdown timer (just button enable/disable)
- NO Radix Sheet component (use custom CSS transforms like CountryDrawer)
- NO changes to Grizzly API wrapper
- NO changes to payment/credit flow
- NO changes to admin dashboard
- NO new pages or routes
- NO retry logic for failed activations (scope creep)
- NO notification system (scope creep)
- NO analytics/tracking additions (scope creep)
- NO `console.log` in production code (use structured logger)
- NO `throw new Error()` in services (use `this.error()`)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (no formal test framework detected in exploration, but `bun test` available)
- **Automated tests**: NO (QA via agent-executed scenarios only, no unit test framework setup in plan)
- **Framework**: N/A
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Service Logic**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — service layer + types):
├── Task 1: Add getStatus() v1 to Grizzly service [quick]
├── Task 2: Add timerExpiresAt to ActivationInfo type + API route [quick]
└── Task 3: Create ActivationSheet component shell [visual-engineering]

Wave 2 (After Wave 1 — hooks + service logic):
├── Task 4: Add cancel detection to activation.service.ts [unspecified-high]
├── Task 5: Update use-activation hook with cancel detection + timerExpiresAt [deep]
└── Task 6: Build ActivationSheet full UI (phases: confirm → waiting → code received) [visual-engineering]

Wave 3 (After Wave 2 — integration + state fixes):
├── Task 7: Fix state transitions: eliminate "Demandé" in UI [deep]
└── Task 8: Integrate Sheet into orchestrator + activation card [visual-engineering]

Wave 4 (After Wave 3 — cancel button + copy):
├── Task 9: Add cancel button with 5-min cooldown to Sheet [visual-engineering]
└── Task 10: Add copyable phone number to Sheet [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 4 → Task 5 → Task 7 → Task 8 → Task 9 → F1-F4 → user okay
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 3 (Waves 1 & 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 4, 5 | 1 |
| 2 | - | 5, 9 | 1 |
| 3 | - | 6, 8 | 1 |
| 4 | 1 | 7 | 2 |
| 5 | 1, 2 | 7, 9 | 2 |
| 6 | 3 | 8 | 2 |
| 7 | 4, 5 | 8 | 3 |
| 8 | 6, 7 | 9, 10 | 3 |
| 9 | 2, 8 | F3 | 4 |
| 10 | 8 | F3 | 4 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 `quick`, T2 `quick`, T3 `visual-engineering`
- **Wave 2**: 3 tasks — T4 `unspecified-high`, T5 `deep`, T6 `visual-engineering`
- **Wave 3**: 2 tasks — T7 `deep`, T8 `visual-engineering`
- **Wave 4**: 2 tasks — T9 `visual-engineering`, T10 `quick`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. Add getStatus() v1 to Grizzly service

  **What to do**:
  - Add `getStatus()` v1 method to `src/services/grizzly/activation.ts` that calls the Grizzly API endpoint `https://api.grizzlysms.com/stubs/handler_api.php` with `action=getStatus&id={activationId}`
  - The v1 API returns a text response: `STATUS_WAIT_CODE`, `STATUS_WAIT_RESEND`, `STATUS_CANCEL`, `STATUS_OK`, or a number (remaining time in seconds)
  - Add `ActivationStatusV1` type to `src/services/grizzly/types.ts` representing the parsed v1 response
  - Expose the method on `src/services/grizzly/client.ts` following the existing pattern (e.g., `getStatusV1(id: number)`)
  - Use `this.httpGet<string>()` (raw text response, not JSON) with retry logic (exponential backoff, max 3 attempts, only retry on 5xx/429)
  - Parse the text response inside the method: if response starts with `STATUS_` return enum value, if numeric return remaining seconds, otherwise treat as error

  **Must NOT do**:
  - Do NOT modify `getStatusV2()` or any existing v2 methods
  - Do NOT change the Grizzly API base URL or auth pattern
  - Do NOT add new environment variables
  - Do NOT use `throw new Error()` — use `this.error()` per project conventions

  **Recommended Agent Profile**:
  > - **Category**: `quick`
    - Reason: Single method addition following existing patterns in the same file
  - **Skills**: [`backend-patterns`]
    - `backend-patterns`: API routing patterns and service layer conventions

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2 and 3)
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None (can start immediately)

  **References**:
  **Pattern References**:
  - `src/services/grizzly/activation.ts` — Existing `getStatusV2()` method pattern to follow for the new v1 method
  - `src/services/grizzly/client.ts:30-50` — Client class structure and method registration pattern
  - `src/services/grizzly/types.ts` — Existing type definitions (`GrizzlyNumber`, `GrizzlyActivationStatus`) to extend

  **API/Type References**:
  - `src/services/grizzly/types.ts:GrizzlyActivationStatus` — Existing v2 status type; add `ActivationStatusV1` alongside it
  - `/home/afreeserv/project/grizzly-wrapper-optimization/` — Reference project with better Grizzly API documentation and v1 status parsing examples

  **External References**:
  - Grizzly SMS API: `https://api.grizzlysms.com/stubs/handler_api.php` with `action=getStatus&id={id}` — returns plain text like `STATUS_CANCEL`, `STATUS_WAIT_CODE`, `STATUS_OK`, or a number (seconds remaining)

  **WHY Each Reference Matters**:
  - `activation.ts`: The new v1 method must follow the exact same pattern as `getStatusV2()` for consistency
  - `client.ts`: Method must be registered on the client class following the same registration pattern
  - `types.ts`: New type must coexist with existing `GrizzlyActivationStatus` type
  - Grizzly wrapper: Contains clearer documentation of the v1 API response format than the current app's implementation

  **Acceptance Criteria**:
  - [ ] `getStatusV1()` method exists on `GrizzlyActivationService` class in `activation.ts`
  - [ ] Method is exposed on `GrizzlyClient` in `client.ts`
  - [ ] `ActivationStatusV1` type added to `types.ts`
  - [ ] Method handles text responses: `STATUS_WAIT_CODE`, `STATUS_WAIT_RESEND`, `STATUS_CANCEL`, `STATUS_OK`
  - [ ] Method handles numeric responses (seconds remaining)
  - [ ] Method uses `this.withRetry()` for 5xx/429 errors
  - [ ] Method uses `this.error()` for error creation (not `throw new Error()`)
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: getStatusV1 returns STATUS_CANCEL for cancelled activation
    Tool: Bash (curl)
    Preconditions: Grizzly API is accessible with valid API key
    Steps:
      1. Call `getStatusV1(id)` for a cancelled activation ID
      2. Verify the method returns `{ status: 'STATUS_CANCEL' }`
    Expected Result: Returns parsed object with `status: 'STATUS_CANCEL'`
    Failure Indicators: Returns raw string, throws error, or returns wrong type
    Evidence: .sisyphus/evidence/task-1-getstatus-v1-cancel.txt

  Scenario: getStatusV1 handles error response gracefully
    Tool: Bash (bun)
    Preconditions: Mock a 500 response from Grizzly API
    Steps:
      1. Call `getStatusV1(id)` with a request that triggers a server error
      2. Verify the method retries (up to 3 times with backoff)
      3. Verify it throws a `ServiceError` with proper code (not `new Error()`)
    Expected Result: Retries 3 times, then throws `ServiceError` with appropriate code
    Failure Indicators: Throws `Error` instead of `ServiceError`, or doesn't retry
    Evidence: .sisyphus/evidence/task-1-getstatus-v1-error.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(activation): add getStatus v1 cancel detection and expose timerExpiresAt`
  - Files: `src/services/grizzly/activation.ts`, `src/services/grizzly/types.ts`, `src/services/grizzly/client.ts`
  - Pre-commit: `bun run build`

- [x] 2. Expose timerExpiresAt to frontend (type + API route)

  **What to do**:
  - Add `timerExpiresAt: Date | null` field to `ActivationInfo` type in `src/type/activation.ts`
  - Update `app/api/client/activations/[id]/route.ts` GET handler to include `timerExpiresAt` in the response, serializing it as ISO string
  - The `timerExpiresAt` field already exists in the DB schema (`src/database/schemas/activations.ts:smsActivation.timerExpiresAt`)
  - Ensure the field is nullable-safe (handle `null` case where timer hasn't been set yet)
  - Update `src/hooks/use-numbers.ts` hook's `useActivation()` to pass `timerExpiresAt` through from API response

  **Must NOT do**:
  - Do NOT create new database migrations — the field already exists
  - Do NOT change the DB schema
  - Do NOT modify the `smsActivation` Drizzle schema file beyond what's already there
  - Do NOT add new API endpoints — just extend the existing `[id]` route response

  **Recommended Agent Profile**:
  > - **Category**: `quick`
    - Reason: Type addition + API response field extension, follows existing patterns
  - **Skills**: [`backend-patterns`, `api-design`]
    - `backend-patterns`: API route pattern and serialization conventions
    - `api-design`: Proper field exposure and response format

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1 and 3)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5, 9
  - **Blocked By**: None (can start immediately)

  **References**:
  **Pattern References**:
  - `src/type/activation.ts` — Existing `ActivationInfo` type to extend with `timerExpiresAt`
  - `app/api/client/activations/[id]/route.ts` — Existing GET handler to update with new field

  **API/Type References**:
  - `src/database/schemas/activations.ts:smsActivation.timerExpiresAt` — DB column definition (timestamp, nullable)
  - `src/hooks/use-numbers.ts:useActivation()` — Existing hook that consumes the API response

  **WHY Each Reference Matters**:
  - `activation.ts` type: Must add the field to the type definition so TypeScript enforces it everywhere
  - API route: Must serialize `timerExpiresAt` as ISO string so frontend can compute cooldown delta
  - DB schema: Confirms the column exists and is nullable (handles the `null` case in API)
  - Hook: Must pass the field through so UI can use it for cancel button cooldown

  **Acceptance Criteria**:
  - [ ] `timerExpiresAt: Date | null` added to `ActivationInfo` type in `src/type/activation.ts`
  - [ ] API route `GET /api/client/activations/[id]` includes `timerExpiresAt` in response
  - [ ] `null` values handled correctly (serialized as `null`, not `"null"` string)
  - [ ] `useActivation()` hook passes `timerExpiresAt` to consumers
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: timerExpiresAt is exposed for active activation
    Tool: Bash (curl)
    Preconditions: Authenticated session, active activation exists
    Steps:
      1. `curl -H "Cookie: session=..." /api/client/activations/{activeId}`
      2. Verify response JSON contains `timerExpiresAt` field with ISO timestamp
    Expected Result: `timerExpiresAt: "2026-04-08T15:30:00.000Z"` (valid ISO string)
    Failure Indicators: Field missing, null when it shouldn't be, or wrong format
    Evidence: .sisyphus/evidence/task-2-timer-expires-active.txt

  Scenario: timerExpiresAt is null for completed activation
    Tool: Bash (curl)
    Preconditions: Authenticated session, completed activation exists
    Steps:
      1. `curl -H "Cookie: session=..." /api/client/activations/{completedId}`
      2. Verify `timerExpiresAt` is `null` in response
    Expected Result: `timerExpiresAt: null`
    Failure Indicators: Field missing, undefined, or string "null" instead of JSON null
    Evidence: .sisyphus/evidence/task-2-timer-expires-null.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(activation): add getStatus v1 cancel detection and expose timerExpiresAt`
  - Files: `src/type/activation.ts`, `app/api/client/activations/[id]/route.ts`, `src/hooks/use-numbers.ts`
  - Pre-commit: `bun run build`

- [x] 3. Create ActivationSheet component shell

  **What to do**:
  - Create `src/component/numbers/activation-sheet.tsx` — the main Sheet component following CountryDrawer pattern
  - Create `src/component/numbers/activation-sheet.module.css` — CSS module with `translate-y-full` / `translate-y-0` transitions
  - The Sheet should have three visual phases: **confirm** (mini step, replaces ConfirmDialog), **waiting** (number displayed + waiting for SMS), **code-received** (SMS code displayed)
  - Follow CountryDrawer's pattern: overlay backdrop, slide-up animation, close on backdrop click, close button
  - Use `'use client'` directive since Sheet needs interactivity
  - Accept props: `open: boolean`, `onClose: () => void`, `activationId: string | null`, and phase-specific content callbacks
  - Export from barrel file if one exists, otherwise standalone export
  - This is a SHELL — just the structure and animations, no business logic yet (that comes in Task 6)

  **Must NOT do**:
  - Do NOT use Radix Sheet (`src/component/ui/sheet.tsx`) — use custom CSS transforms like CountryDrawer
  - Do NOT add business logic (cancel, copy, polling) — that's Task 6, 9, 10
  - Do NOT import from `@/components/ui/sheet`
  - Do NOT use `console.log` for debugging
  - Do NOT exceed 150 lines per file

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering`
    - Reason: UI component creation with CSS animations and responsive layout
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: React component patterns, state management, CSS modules

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1 and 2)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 6, 8
  - **Blocked By**: None (can start immediately)

  **References**:
  **Pattern References (CRITICAL)**:
  - `src/component/numbers/country-drawer.tsx` — **THE PRIMARY REFERENCE**. Copy the Sheet pattern exactly: CSS transform animations, overlay backdrop, close-on-backdrop-click, slide-up behavior
  - `src/component/numbers/country-drawer.module.css` — **THE CSS REFERENCE**. Copy the transition timing, easing, and transform pattern

  **API/Type References**:
  - `src/type/activation.ts` — Type definitions that the Sheet will consume (activation state, phone number, etc.)

  **WHY Each Reference Matters**:
  - `country-drawer.tsx`: This is the EXACT pattern to follow. The ActivationSheet must feel and behave identically to CountryDrawer — same animation timing, same overlay approach, same close behavior
  - `country-drawer.module.css`: Contains the exact CSS transition classes to replicate (`.sheet`, `.sheetOpen`, `.overlay`, etc.)

  **Acceptance Criteria**:
  - [ ] `activation-sheet.tsx` created with `'use client'` directive
  - [ ] `activation-sheet.module.css` created with slide-up animations matching CountryDrawer
  - [ ] Component accepts `open`, `onClose`, `activationId` props
  - [ ] Sheet slides up from bottom when `open={true}`
  - [ ] Sheet slides down when `open={false}`
  - [ ] Dark overlay appears behind Sheet
  - [ ] Clicking overlay calls `onClose()`
  - [ ] Close button (X) in top-right corner calls `onClose()`
  - [ ] Sheet has placeholder sections for: confirm phase, waiting phase, code-received phase
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Sheet opens and closes with animation
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to numbers page
      2. Trigger Sheet open (set open=true via component state)
      3. Verify overlay appears with `opacity > 0`
      4. Verify Sheet container has `transform: translateY(0)`
      5. Click overlay (outside Sheet)
      6. Verify Sheet slides down (transform: translateY(100%))
      7. Verify overlay fades out
    Expected Result: Sheet animates up on open, down on close, overlay fades in/out
    Failure Indicators: No animation, Sheet appears instantly, overlay doesn't respond to clicks
    Evidence: .sisyphus/evidence/task-3-sheet-animation.png

  Scenario: Sheet close button works
    Tool: Playwright
    Preconditions: Sheet is open
    Steps:
      1. Locate close button (X) in Sheet header
      2. Click the close button
      3. Verify `onClose()` callback was called
      4. Verify Sheet is no longer visible
    Expected Result: Close button dismisses Sheet with animation
    Failure Indicators: Button doesn't respond, Sheet stays open, no callback fired
    Evidence: .sisyphus/evidence/task-3-sheet-close.png
  ```

  **Commit**: YES
  - Message: `feat(ui): create ActivationSheet component shell following CountryDrawer pattern`
  - Files: `src/component/numbers/activation-sheet.tsx`, `src/component/numbers/activation-sheet.module.css`
  - Pre-commit: `bun run build`

- [x] 4. Add cancel detection to activation.service.ts

  **What to do**:
  - Add `checkCancellationStatus(id: number)` method to `src/services/activation.service.ts` that:
    1. Calls `grizzlyClient.activation.getStatusV1(id)` to get v1 status
    2. If v1 returns `STATUS_CANCEL`, update the DB activation state to `cancelled`
    3. If v1 returns `STATUS_OK` or `STATUS_WAIT_CODE`, return `active` status
    4. If v1 returns a numeric value (seconds remaining), return `active` with remaining time
    5. On error, log silently and return `active` (don't break the flow for a status check failure)
  - Add `cancelActivation(id: number, reason?: string)` method that:
    1. Calls `grizzlyClient.activation.setStatus(id, 8)` (cancel code 8 for after ACCESS_READY)
    2. Updates DB state to `cancelled`
    3. Releases any credit holds
    4. Returns success/failure
  - Follow BaseService patterns: use `this.log`, `this.error`, `this.assert`, `this.withRetry`, `this.transaction`
  - Use `throw this.error(...)` not `throw new Error(...)`

  **Must NOT do**:
  - Do NOT modify `getStatusV2()` or any existing methods
  - Do NOT change the DB schema
  - Do NOT use `console.log` — use `this.log`
  - Do NOT use `throw new Error()` — use `this.error()`
  - Do NOT add new API routes (that's Task 5's job)

  **Recommended Agent Profile**:
  > - **Category**: `unspecified-high`
    - Reason: Service layer logic with cancel detection, state transitions, and error handling — needs careful implementation
  - **Skills**: [`backend-patterns`]
    - `backend-patterns`: Service layer patterns, BaseService methods, transaction handling

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5 and 6)
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 1 (needs getStatusV1 method)

  **References**:
  **Pattern References**:
  - `src/services/activation.service.ts` — Existing `ActivationService` class to extend with new methods. Follow the same `extends BaseService` pattern, use `this.log`, `this.error`, `this.withRetry`
  - `src/services/activation.service.ts:getStatus()` — Existing method pattern for calling Grizzly

  **API/Type References**:
  - `src/services/grizzly/activation.ts` — The `getStatusV1()` method added in Task 1 — call it from here
  - `src/services/grizzly/types.ts:ActivationStatusV1` — The v1 status type to handle `STATUS_CANCEL`
  - `src/database/schemas/activations.ts:smsActivation` — DB schema for activation record operations
  - `src/database/schemas/enums.ts:activationStateEnum` — The enum values for DB updates (`cancelled`)

  **Test References**:
  - Existing service methods that update activation state (find a `setStatus` or state transition pattern to follow)

  **External References**:
  - `/home/afreeserv/project/grizzly-wrapper-optimization/` — Reference project with Grizzly `setStatus(id, 8)` cancel pattern

  **WHY Each Reference Matters**:
  - `activation.service.ts`: Must follow the EXACT same BaseService pattern — this is non-negotiable for code consistency
  - `getStatusV1()`: This is the method we just added in Task 1 — call it to detect cancellations
  - `ActivationStatusV1` type: Know which status values to handle (`STATUS_CANCEL`, `STATUS_WAIT_CODE`, etc.)
  - DB schema: Need to know the exact column names and types for DB updates
  - Grizzly wrapper: Confirms `setStatus(id, 8)` is the correct cancel code after ACCESS_READY

  **Acceptance Criteria**:
  - [ ] `checkCancellationStatus(id: number)` method exists on `ActivationService`
  - [ ] Method calls `getStatusV1()` and detects `STATUS_CANCEL`
  - [ ] On `STATUS_CANCEL`, updates DB state to `cancelled` and releases credit holds
  - [ ] On `STATUS_OK` / `STATUS_WAIT_CODE`, returns `active` status
  - [ ] On error, logs silently and returns `active` (doesn't break the flow)
  - [ ] `cancelActivation(id: number)` method exists on `ActivationService`
  - [ ] Cancel method calls `setStatus(id, 8)` via Grizzly API
  - [ ] Cancel method updates DB state to `cancelled`
  - [ ] Cancel method releases credit holds via transaction
  - [ ] Both methods use `this.error()` for errors (not `throw new Error()`)
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: checkCancellationStatus detects STATUS_CANCEL
    Tool: Bash (bun)
    Preconditions: Test activation ID that was cancelled on Grizzly
    Steps:
      1. Import ActivationService
      2. Call `service.checkCancellationStatus(cancelledId)`
      3. Verify it returns `{ status: 'cancelled' }`
      4. Verify DB record for that ID has `state = 'cancelled'`
    Expected Result: Returns cancelled status and updates DB
    Failure Indicators: Returns 'active' for cancelled activation, doesn't update DB, throws error
    Evidence: .sisyphus/evidence/task-4-cancel-detection.txt

  Scenario: checkCancellationStatus handles Grizzly error gracefully
    Tool: Bash (bun)
    Preconditions: Grizzly API returns 500 error
    Steps:
      1. Call `service.checkCancellationStatus(id)` with a request that triggers server error
      2. Verify it logs a warning (not an error stack)
      3. Verify it returns `{ status: 'active' }` (fails safe to "active")
    Expected Result: Logs warning, returns active status, does NOT throw or break the flow
    Failure Indicators: Throws error, returns null/undefined, breaks entire polling cycle
    Evidence: .sisyphus/evidence/task-4-error-handling.txt

  Scenario: cancelActivation calls setStatus(id, 8) and updates DB
    Tool: Bash (bun)
    Preconditions: Active activation ID
    Steps:
      1. Call `service.cancelActivation(activeId)`
      2. Verify Grizzly `setStatus(id, 8)` was called
      3. Verify DB record updated to `state = 'cancelled'`
      4. Verify credit hold was released
    Expected Result: Activation cancelled on both Grizzly and DB, credits released
    Failure Indicators: Grizzly not called, DB not updated, holds not released
    Evidence: .sisyphus/evidence/task-4-cancel-activation.txt
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(activation): add cancel detection service + hook with getStatus v1 and timerExpiresAt`
  - Files: `src/services/activation.service.ts`
  - Pre-commit: `bun run build`

- [x] 5. Update use-activation hook with cancel detection + timerExpiresAt

  **What to do**:
  - Update `useActivation()` in `src/hooks/use-numbers.ts` to:
    1. Poll `checkCancellationStatus()` via the API alongside `getStatusV2()` every 2-5 seconds (staggered: v2 poll every 2s, v1 cancel check every 5s)
    2. Expose `timerExpiresAt: Date | null` from the API response
    3. Compute `cancelEnabled: boolean` — `true` when `timerExpiresAt <= now`
    4. Expose `cancel(id: number)` action that calls the cancel API endpoint
    5. Stop polling in terminal states (`cancelled`, `expired`, `completed`, `failed`)
  - Follow existing hook patterns in `use-numbers.ts` (React Query, `useQuery`, `useMutation`)
  - The cancel check should use a separate query key to avoid cache invalidation on regular status checks

  **Must NOT do**:
  - Do NOT change the existing `useActivationsList()` hook
  - Do NOT modify the polling intervals for `useActivationsList()`
  - Do NOT use `console.log` for debugging
  - Do NOT add `any` types

  **Recommended Agent Profile**:
  > - **Category**: `deep`
    - Reason: Needs careful integration of cancel detection with existing polling, timer calculation, and React Query patterns
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: React Query patterns, hook composition, state synchronization

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4 and 6)
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2 (needs getStatusV1 and timerExpiresAt)

  **References**:
  **Pattern References**:
  - `src/hooks/use-numbers.ts:useActivation()` — Existing activation hook with 2s polling to extend
  - `src/hooks/use-numbers.ts` — React Query patterns, `useQuery`/`useMutation` usage

  **API/Type References**:
  - `src/type/activation.ts:ActivationInfo` — Type with `timerExpiresAt` (added in Task 2)
  - `app/api/client/activations/[id]/route.ts` — API endpoint that returns `timerExpiresAt`

  **WHY Each Reference Matters**:
  - `useActivation()`: Must follow the exact same pattern — `useQuery` with `select` transforms, `refetchInterval` for polling
  - `ActivationInfo`: Must consume the `timerExpiresAt` field and compute `cancelEnabled`
  - API route: Must call the endpoint that returns `timerExpiresAt` and cancel status

  **Acceptance Criteria**:
  - [ ] `useActivation()` exposes `cancelEnabled: boolean` (computed from `timerExpiresAt <= now`)
  - [ ] `useActivation()` exposes `timerExpiresAt: Date | null`
  - [ ] `useActivation()` performs cancel detection poll (separate query key, every 5s)
  - [ ] `useActivation()` stops all polling in terminal states
  - [ ] `cancel(id)` mutation exposed from hook
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: hook exposes cancelEnabled after timerExpiresAt has passed
    Tool: Playwright (browser console)
    Preconditions: Activation with timerExpiresAt in the past
    Steps:
      1. Load the activation via useActivation(id)
      2. Check that `cancelEnabled === true` in the hook return
    Expected Result: `cancelEnabled` is `true` when timer has expired
    Failure Indicators: Always false, null, or undefined regardless of timer state
    Evidence: .sisyphus/evidence/task-5-cancel-enabled.txt

  Scenario: hook stops polling when state is cancelled
    Tool: Playwright (browser network tab)
    Preconditions: Activation state changed to `cancelled`
    Steps:
      1. Load the activation via useActivation(id)
      2. Verify no further poll requests are made after 5 seconds
    Expected Result: Polling stops, no more network requests for this activation
    Failure Indicators: Requests continue indefinitely
    Evidence: .sisyphus/evidence/task-5-poll-stops.png
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(activation): add cancel detection service + hook with getStatus v1 and timerExpiresAt`
  - Files: `src/hooks/use-numbers.ts`
  - Pre-commit: `bun run build`

- [x] 6. Build ActivationSheet full UI (phases: confirm → waiting → code received)

  **What to do**:
  - Complete the `src/component/numbers/activation-sheet.tsx` shell from Task 3 with full UI for all phases:
    1. **Confirm phase**: Service name, country, price, confirm button (replaces ConfirmDialog)
    2. **Waiting phase**: Phone number prominently displayed (large font), copy button, "En attente du SMS..." message with pulsing animation, retry button, cancel button (disabled for 5 min)
    3. **Code-received phase**: SMS code displayed prominently, copy button, phone number shown
  - The Sheet should auto-transition between phases: confirm → waiting (after purchase), waiting → code-received (when SMS arrives)
  - Follow the visual design of CountryDrawer: rounded top corners, header with title + close, scrollable content, shadow
  - Use the same CSS transitions as CountryDrawer (translate-y)
  - Accept props from parent: `open`, `onClose`, `activationId`, `initialPhase`, `onConfirm` callback
  - The confirm phase should render `src/component/numbers/confirm-purchase-summary.tsx` as its content
  - Phone number display should include country code prefix (e.g., "+237 688 XXX XXX")

  **Must NOT do**:
  - Do NOT use Radix Sheet — use custom CSS transforms
  - Do NOT implement cancel logic (that's Task 9)
  - Do NOT implement copy-to-clipboard (that's Task 10)
  - Do NOT change other components' logic
  - Do NOT exceed 150 lines per file

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering`
    - Reason: Full UI component with phases, animations, responsive layout
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: React component composition, conditional rendering, animation patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 8
  - **Blocked By**: Task 3 (needs sheet shell)

  **References**:
  **Pattern References**:
  - `src/component/numbers/country-drawer.tsx` — Animation, layout, close behavior, header pattern
  - `src/component/numbers/country-drawer.module.css` — CSS transitions, overlay, sheet styling
  - `src/component/numbers/confirm-purchase-summary.tsx` — Content to embed in confirm phase
  - `src/component/numbers/activation-active-view.tsx` — Existing waiting UI to adapt into Sheet phase

  **API/Type References**:
  - `src/type/activation.ts` — Types for activation state, phone number, SMS code
  - `src/component/numbers/confirm-dialog.tsx` — Current confirm flow to replace

  **WHY Each Reference Matters**:
  - CountryDrawer: THE pattern to match exactly — animations, layout, overlay
  - Confirm-purchase-summary: The content component to embed in the confirm phase
  - Activation-active-view: Adapt the waiting/received UI into Sheet phases
  - Confirm-dialog: Understand what we're replacing to ensure feature parity

  **Acceptance Criteria**:
  - [ ] Confirm phase renders service name, country, price, and confirm button
  - [ ] Waiting phase renders phone number prominently with copy button
  - [ ] Waiting phase shows "En attente du SMS..." with pulsing bar animation
  - [ ] Code-received phase shows SMS code prominently with copy button
  - [ ] Sheet transitions between phases smoothly
  - [ ] Sheet follows CountryDrawer visual pattern exactly
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Confirm phase shows correct purchase info
    Tool: Playwright
    Preconditions: Service selected, Sheet open in confirm phase
    Steps:
      1. Open Sheet with initialPhase="confirm"
      2. Verify service name is displayed
      3. Verify country flag is displayed
      4. Verify price is displayed
      5. Verify confirm button is clickable
    Expected Result: All purchase details displayed correctly, confirm button functional
    Failure Indicators: Missing fields, wrong data, button not responding
    Evidence: .sisyphus/evidence/task-6-sheet-confirm.png

  Scenario: Waiting phase shows phone number and pulsing animation
    Tool: Playwright
    Preconditions: Activation just purchased, Sheet open in waiting phase
    Steps:
      1. Open Sheet with initialPhase="waiting"
      2. Verify phone number is displayed (e.g., "+237 688 XXX XXX")
      3. Verify "En attente du SMS..." text is visible
      4. Verify pulsing progress bar animation is running
      5. Verify copy button is present
    Expected Result: Phone number visible, animation running, copy button present
    Failure Indicators: No phone number, no animation, no copy button
    Evidence: .sisyphus/evidence/task-6-sheet-waiting.png
  ```

  **Commit**: YES
  - Message: `feat(ui): build ActivationSheet full UI with confirm → waiting → code-received phases`
  - Files: `src/component/numbers/activation-sheet.tsx`, `src/component/numbers/activation-sheet.module.css`
  - Pre-commit: `bun run build`

- [x] 7. Fix state transitions: eliminate "Demandé" in UI

  **What to do**:
  - Modify `src/component/numbers/active-activation-card.tsx` to handle the `requested` state properly:
    1. Instead of showing "Demandé" with no phone number, show the waiting state immediately
    2. If phone number exists in activation data, display it (copyable)
    3. If phone number doesn't exist yet (still in `requested`), show "Achat en cours..." with pulsing animation (transient, <3 seconds)
    4. Transition from `requested` to `waiting` happens automatically when Grizzly returns the number
  - The `requested` state is transient (DB state before Grizzly API returns the number) — the UI should not show it as a stable state
  - Add a click handler on the card to open the ActivationSheet
  - Add an `onClick` prop that the parent orchestrator can use to open the Sheet

  **Must NOT do**:
  - Do NOT modify the DB schema or state enum
  - Do NOT change the API response format (that's Task 2)
  - Do NOT add new API routes
  - Do NOT modify the service layer (that's Task 4)

  **Recommended Agent Profile**:
  > - **Category**: `deep`
    - Reason: Complex state transition logic with edge cases, requires careful understanding of the activation lifecycle
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: React state patterns, conditional rendering, transition animations

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 3 (with Task 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5 (needs cancel detection service + hook)

  **References**:
  **Pattern References**:
  - `src/component/numbers/active-activation-card.tsx` — Current card to modify; see existing STATE_CONFIG and state-to-icon mapping

  **API/Type References**:
  - `src/database/schemas/enums.ts:activationStateEnum` — All DB states including `requested`, `assigned`, `waiting`, `completed`, `cancelled`, `expired`
  - `src/type/activation.ts:ActivationInfo` — Frontend type with `timerExpiresAt`, `phoneNumber`, `state`

  **WHY Each Reference Matters**:
  - `active-activation-card.tsx`: The card currently shows "Demandé" for `requested` state — we need to change this to show "waiting" UI instead
  - `activationStateEnum`: Must understand all possible states to handle transitions correctly
  - `ActivationInfo`: Must use `timerExpiresAt` and `phoneNumber` fields for proper display

  **Acceptance Criteria**:
  - [ ] `requested` state no longer shows "Demandé" label with no phone number
  - [ ] `requested` state with phone number shows waiting UI with number displayed
  - [ ] `requested` state without phone number shows "Achat en cours..." with pulsing animation
  - [ ] Card transitions from "Achat en cours" to "waiting" automatically when data updates
  - [ ] Clicking the card calls the `onClick` prop (for Sheet opening)
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: requested state with phone number shows waiting UI
    Tool: Playwright
    Preconditions: Activation in `requested` state with phoneNumber populated
    Steps:
      1. Navigate to activations list
      2. Find the activation card for the requested activation
      3. Verify the card shows the phone number (not "Demandé")
      4. Verify the waiting animation is visible
    Expected Result: Phone number visible, waiting animation present, no "Demandé" label
    Failure Indicators: "Demandé" label visible, no phone number, no animation
    Evidence: .sisyphus/evidence/task-7-requested-with-number.png

  Scenario: requested state without phone number shows transitional message
    Tool: Playwright
    Preconditions: Activation in `requested` state with no phoneNumber yet
    Steps:
      1. Navigate to activations list
      2. Find the activation card
      3. Verify it shows "Achat en cours..." with pulsing animation
      4. Wait for data update (should auto-transition when number arrives)
    Expected Result: Shows transitional message, then updates to waiting state with number
    Failure Indicators: Stuck on "Achat en cours" indefinitely, or shows "Demandé"
    Evidence: .sisyphus/evidence/task-7-requested-no-number.png
  ```

  **Commit**: YES (groups with Task 8)
  - Message: `feat(activation): fix state transitions + integrate Sheet into orchestrator and card`
  - Files: `src/component/numbers/active-activation-card.tsx`
  - Pre-commit: `bun run build`

- [x] 8. Integrate Sheet into orchestrator + activation card

  **What to do**:
  - Update `src/component/numbers/my-space-orchestrator.tsx` to:
    1. Add `activationSheetState: { open: boolean; activationId: string | null; phase: 'confirm' | 'waiting' | 'code-received' }` to state
    2. Add `openActivationSheet(id, phase)` and `closeActivationSheet()` action handlers
    3. Pass `onActivationClick` callback to activations list
    4. Render `<ActivationSheet>` component with state from orchestrator
  - Update `src/component/numbers/activations-list.tsx` to:
    1. Accept `onActivationClick(id: string)` prop
    2. Pass it to each `<ActiveActivationCard>` as `onClick`
  - The orchestrator opens the Sheet when:
    - User clicks an activation card → open Sheet in current phase (waiting or code-received)
    - Purchase completes → open Sheet in "waiting" phase

  **Must NOT do**:
  - Do NOT modify the service layer
  - Do NOT change the hook logic
  - Do NOT add new API routes
  - Do NOT use `console.log`

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering`
    - Reason: UI integration and state management across components
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: React component composition, state lifting, callback patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7)
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Task 6 (needs Sheet UI), Task 7 (needs card click handler)

  **References**:
  **Pattern References**:
  - `src/component/numbers/my-space-orchestrator.tsx` — Orchestrator to add Sheet state management
  - `src/component/numbers/activations-list.tsx` — List component to wire up click handlers
  - `src/component/numbers/country-drawer.tsx` — Sheet state management pattern to follow

  **WHY Each Reference Matters**:
  - Orchestrator: This is where Sheet state lives, similar to how CountryDrawer state is managed
  - Activations-list: Must accept and forward `onActivationClick` prop to cards
  - CountryDrawer: Pattern for Sheet state management and close callbacks

  **Acceptance Criteria**:
  - [ ] Orchestrator has `activationSheetState` with `open`, `activationId`, `phase`
  - [ ] `openActivationSheet(id, phase)` and `closeActivationSheet()` handlers exist
  - [ ] `onActivationClick` passed to activations list
  - [ ] Clicking a card opens the Sheet
  - [ ] Sheet closes when `closeActivationSheet()` is called
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Clicking activation card opens the Sheet
    Tool: Playwright
    Preconditions: At least one active activation exists
    Steps:
      1. Navigate to activations list
      2. Click on an activation card
      3. Verify the Sheet overlay appears
      4. Verify the Sheet shows the correct activation data
      5. Click the Sheet close button
      6. Verify the Sheet closes
    Expected Result: Sheet opens on click, shows activation data, closes on close
    Failure Indicators: No Sheet, wrong data, Sheet doesn't close
    Evidence: .sisyphus/evidence/task-8-sheet-opens.png

  Scenario: Sheet opens in waiting phase after purchase
    Tool: Playwright
    Preconditions: Service selected, price valid, credits available
    Steps:
      1. Complete the purchase flow
      2. Verify the Sheet opens automatically in "waiting" phase
      3. Verify the phone number is displayed
    Expected Result: Sheet opens in waiting phase with phone number after purchase
    Failure Indicators: Sheet doesn't open, opens in wrong phase, no phone number
    Evidence: .sisyphus/evidence/task-8-sheet-after-purchase.png
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(activation): fix state transitions + integrate Sheet into orchestrator and card`
  - Files: `src/component/numbers/my-space-orchestrator.tsx`, `src/component/numbers/activations-list.tsx`
  - Pre-commit: `bun run build`

- [x] 9. Add cancel button with 5-minute cooldown to Sheet

  **What to do**:
  - Add cancel button to the waiting phase of `ActivationSheet`:
    1. Button text: "Annuler la demande"
    2. Button is disabled when `cancelEnabled === false` (from hook, Task 5)
    3. Button is enabled when `cancelEnabled === true` (5 minutes have passed since `timerExpiresAt`)
    4. Button is disabled in `code-received` phase (can't cancel after SMS arrives)
    5. Button triggers `cancel(id)` action from hook (Task 5)
    6. On cancel success: close Sheet, show toast "Demande annulée"
    7. On cancel failure: show error toast "Impossible d'annuler, veuillez réessayer"
  - Style the button: outline variant, red text, rounded, full width at bottom of waiting phase
  - Follow existing button patterns in the project (check shadcn/ui Button component)

  **Must NOT do**:
  - Do NOT implement the actual cancel logic in the component — delegate to hook's `cancel(id)` (Task 5)
  - Do NOT add a visible countdown timer
  - Do NOT modify other components
  - Do NOT use `console.log`

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering`
    - Reason: UI component with state-dependent button behavior, visual feedback
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: Button variants, conditional disable, toast patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10)
  - **Parallel Group**: Wave 4 (with Task 10)
  - **Blocks**: F3 (final QA)
  - **Blocked By**: Tasks 2, 8 (needs timerExpiresAt exposed, Sheet integrated)

  **References**:
  **Pattern References**:
  - `src/component/ui/button.tsx` — Button component to use for cancel button
  - `src/component/numbers/activation-sheet.tsx` — Sheet component to add cancel button to

  **API/Type References**:
  - `src/hooks/use-numbers.ts:useActivation()` — Hook exposing `cancelEnabled` and `cancel(id)` action

  **WHY Each Reference Matters**:
  - Button component: Must use the existing Button component for visual consistency
  - Sheet component: Where the cancel button lives — must integrate with the waiting phase
  - useActivation hook: Source of `cancelEnabled` state and `cancel` action

  **Acceptance Criteria**:
  - [ ] Cancel button appears in waiting phase of Sheet
  - [ ] Button disabled when `cancelEnabled === false` (within 5-min window)
  - [ ] Button enabled when `cancelEnabled === true` (after 5-min window)
  - [ ] Button disabled in code-received phase
  - [ ] Clicking enabled cancel button calls `cancel(id)` from hook
  - [ ] Success: Sheet closes, toast "Demande annulée"
  - [ ] Failure: Error toast shown
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Cancel button is disabled within 5-minute window
    Tool: Playwright
    Preconditions: Activation just purchased, timerExpiresAt is 5 min in the future
    Steps:
      1. Open Sheet in waiting phase
      2. Verify cancel button is disabled (has disabled attribute)
      3. Clicking cancel button does nothing (no API call)
    Expected Result: Button disabled, clicking has no effect
    Failure Indicators: Button enabled too early, API call fired
    Evidence: .sisyphus/evidence/task-9-cancel-disabled.png

  Scenario: Cancel button is enabled after 5 minutes
    Tool: Playwright
    Preconditions: Activation purchased >5 minutes ago, timerExpiresAt has passed
    Steps:
      1. Open Sheet in waiting phase
      2. Verify cancel button is enabled (no disabled attribute)
      3. Click cancel button
      4. Verify cancel API call was made
      5. Verify Sheet closes
      6. Verify toast "Demande annulée" appears
    Expected Result: Button enabled, cancel succeeds, Sheet closes with toast
    Failure Indicators: Button still disabled, cancel fails, no toast
    Evidence: .sisyphus/evidence/task-9-cancel-enabled.png
  ```

  **Commit**: YES (groups with Task 10)
  - Message: `feat(activation): add cancel button with 5-min cooldown + copyable phone number`
  - Files: `src/component/numbers/activation-sheet.tsx`
  - Pre-commit: `bun run build`

- [x] 10. Add copyable phone number to Sheet

  **What to do**:
  - Add copy-to-clipboard functionality for the phone number in the waiting phase and the SMS code in the code-received phase of `ActivationSheet`:
    1. Phone number: Add a copy icon button next to the phone number
    2. SMS code: Add a copy icon button next to the code
    3. On click: copy text to clipboard using `navigator.clipboard.writeText()`
    4. Show brief toast/feedback: "Numéro copié!" / "Code copié!"
    5. Use the existing `Copy` or `CopyIcon` from lucide-react (check what the project uses)
  - Phone number should include country code prefix (e.g., `+237 688 XXX XXX` format from activation data)

  **Must NOT do**:
  - Do NOT create a new CopyButton component (inline the copy logic)
  - Do NOT use `console.log` for success
  - Do NOT modify other components

  **Recommended Agent Profile**:
  > - **Category**: `quick`
    - Reason: Small feature addition — clipboard API + icon button, following existing patterns
  - **Skills**: [`frontend-patterns`]
    - `frontend-patterns`: Clipboard API, icon buttons, toast patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 9)
  - **Parallel Group**: Wave 4 (with Task 9)
  - **Blocks**: F3 (final QA)
  - **Blocked By**: Task 8 (needs Sheet integrated into orchestrator)

  **References**:
  **Pattern References**:
  - `src/component/numbers/activation-sheet.tsx` — Where copy buttons live
  - `src/component/ui/button.tsx` — IconButton variant to use for copy button

  **API/Type References**:
  - `src/type/activation.ts:ActivationInfo` — `phoneNumber` and `smsCode` fields to copy

  **WHY Each Reference Matters**:
  - Sheet component: Where copy buttons are added — must integrate with existing phone number/code display
  - ActivationInfo: Source of the text to copy (phoneNumber, smsCode)

  **Acceptance Criteria**:
  - [ ] Copy icon button next to phone number in waiting phase
  - [ ] Copy icon button next to SMS code in code-received phase
  - [ ] Clicking copy button copies text to clipboard
  - [ ] Toast "Numéro copié!" appears after copying phone number
  - [ ] Toast "Code copié!" appears after copying SMS code
  - [ ] `bun run build` passes with no TypeScript errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Phone number copy works
    Tool: Playwright
    Preconditions: Sheet open in waiting phase with phone number displayed
    Steps:
      1. Click the copy icon button next to the phone number
      2. Verify toast "Numéro copié!" appears
      3. Paste in a text field to verify clipboard content matches
    Expected Result: Number copied to clipboard, toast confirms
    Failure Indicators: Copy doesn't work, no toast, wrong clipboard content
    Evidence: .sisyphus/evidence/task-10-phone-copy.png

  Scenario: SMS code copy works
    Tool: Playwright
    Preconditions: Sheet open in code-received phase with SMS code displayed
    Steps:
      1. Click the copy icon button next to the SMS code
      2. Verify toast "Code copié!" appears
      3. Paste in a text field to verify clipboard content matches
    Expected Result: Code copied to clipboard, toast confirms
    Failure Indicators: Copy doesn't work, no toast, wrong clipboard content
    Evidence: .sisyphus/evidence/task-10-code-copy.png
  ```

  **Commit**: YES (groups with Task 9)
  - Message: `feat(activation): add cancel button with 5-min cooldown + copyable phone number`
  - Files: `src/component/numbers/activation-sheet.tsx`
  - Pre-commit: `bun run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + linter. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify service patterns (BaseService, this.error, this.assert).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together). Test edge cases: network failure, empty state, concurrent activations. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Commit | Tasks | Message | Files |
|--------|-------|---------|-------|
| 1 | 1, 2 | `feat(activation): add getStatus v1 cancel detection and expose timerExpiresAt` | `src/services/grizzly/activation.ts`, `src/services/grizzly/types.ts`, `src/type/activation.ts`, `app/api/client/activations/[id]/route.ts` |
| 2 | 3 | `feat(ui): create ActivationSheet component shell following CountryDrawer pattern` | `src/component/numbers/activation-sheet.tsx`, `src/component/numbers/activation-sheet.module.css` |
| 3 | 4, 5 | `feat(activation): add cancel detection service + hook with getStatus v1 and timerExpiresAt` | `src/services/activation.service.ts`, `src/hooks/use-numbers.ts` |
| 4 | 6 | `feat(ui): build ActivationSheet full UI with confirm → waiting → code-received phases` | `src/component/numbers/activation-sheet.tsx`, `src/component/numbers/activation-sheet.module.css` |
| 5 | 7, 8 | `feat(activation): fix state transitions + integrate Sheet into orchestrator and card` | `src/component/numbers/active-activation-card.tsx`, `src/component/numbers/my-space-orchestrator.tsx`, `src/component/numbers/activations-list.tsx` |
| 6 | 9, 10 | `feat(activation): add cancel button with 5-min cooldown + copyable phone number` | `src/component/numbers/activation-sheet.tsx` |

---

## Success Criteria

### Verification Commands
```bash
bun run build           # Expected: success, no TypeScript errors
bun run lint            # Expected: no new linting errors
```

### Final Checklist
- [ ] All "Must Have" present (6 items)
- [ ] All "Must NOT Have" absent (10 items)
- [ ] No "Demandé" state shown in UI at any point
- [ ] Cancel detection works via getStatus() v1
- [ ] Cancel button disabled for 5 minutes, then enabled
- [ ] Phone number is copyable in waiting state
- [ ] ActivationSheet opens on card click and after purchase