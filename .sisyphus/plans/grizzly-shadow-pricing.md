# Grizzly SMS Shadow Pricing Integration

## TL;DR

> **Quick Summary**: Replace the massive 400K-row price sync with a "Shadow Pricing" pattern — compute prices dynamically from Grizzly API + margin formula, with DB overrides only for exceptions. Integrate the optimized Grizzly wrapper, add admin country management, and implement full TDD with real purchase testing.
>
> **Deliverables**:
> - Robust `GrizzlyClient` with wrapper utilities (filtering, pagination, flattening)
> - Shadow Pricing Resolver (`resolvePrice`, `resolvePricesForService`)
> - Simplified `SyncService` (mappings only, no massive price sync)
> - Admin Countries API + UI (list, search, override pricing)
> - Database migration (drop `providerServiceCost`/`subProviderCost`, create `price_override`)
> - Client API updated to use shadow pricing
> - Real purchase test flow (< $0.50) with cancel + refund verification
> - "Mes Numéros" tab: pending OTP display, cancel, refund logic
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves (Wave 0 = shared mocks)
> **Critical Path**: T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8

---

## Context

### Original Request
User is doing the final Grizzly SMS integration. They can access the list of all services but NOT the list of all countries. The goal is to implement "Shadow Pricing" — compute prices dynamically from Grizzly API + margin formula, with DB overrides only for admin exceptions.

### Interview Summary
**Key Discussions**:
- **Shadow Pricing Pattern**: DB stores ONLY overrides (10-200 rows), not all 400K price combinations. Default price = Grizzly live price × margin formula.
- **Full Stack**: Plan covers backend (API, services, sync, migration) AND frontend admin panel.
- **TDD**: Test-driven development with test reports. Must include a real purchase test (< $0.50) to verify OTP flow, cancel, and refund. If Grizzly doesn't refund, we don't refund the client.
- **Migration**: Drop `providerServiceCost` and `subProviderCost` tables. Create new minimalist `price_override` table.
- **Wrapper Integration**: The grizzly-wrapper-optimization project has superior filtering, pagination, flattening, and type safety — integrate it.

**Research Findings**:
- Grizzly API `getCountries()` returns 200+ countries (confirmed via curl).
- `getAllCountries()` exists in `src/common/catalog/` but is NEVER exposed via any API route.
- Current countries endpoint requires a service slug — admin needs ALL countries independent of services.
- `syncExternalMappings()` already syncs countries to `externalCountryMapping` — this stays.
- `recalculatePriceRules()` creates 400K+ rows — this is eliminated.

### Metis Review
**Identified Gaps** (addressed):
- Need explicit error handling when Grizzly API is down (fallback to cached prices or stale overrides)
- Need rate limiting consideration for shadow pricing (every page load = Grizzly API call)
- Need to clarify what happens to existing `priceRule` rows during migration
- Need to handle the case where a country exists in Grizzly but not in the static registry

---

## Work Objectives

### Core Objective
Replace massive price synchronization with dynamic shadow pricing, integrate the optimized Grizzly wrapper, add admin country management, and implement full TDD with real purchase testing.

### Concrete Deliverables
- `src/services/grizzly/client.ts` — Enhanced with wrapper methods (getCountries, getPricesV3, searchPricesV3)
- `src/services/grizzly/utils.ts` — Filtering, pagination, flattening utilities
- `src/services/grizzly/types.ts` — Complete type definitions from wrapper
- `src/services/pricing-resolver.service.ts` — Shadow pricing resolver
- `src/services/sync.service.ts` — Simplified (mappings + balance only)
- `src/actions/admin.action.ts` — New country pricing actions
- `app/api/admin/countries/route.ts` — Admin countries list API
- `app/api/admin/countries/[iso]/overrides/route.ts` — Admin price override API
- `app/api/client/services/[slug]/countries/route.ts` — Updated to use shadow pricing
- `app/[locale]/(admin)/admin/countries/page.tsx` — Admin countries management UI
- Database migration — Drop old tables, create `price_override`
- `src/component/admin/country-pricing-table.tsx` — Admin UI component
- `src/component/numbers/pending-activations.tsx` — "Mes Numéros" pending OTP tab
- Test files for all new code

### Definition of Done
- [ ] `bun test` passes with 80%+ coverage on all new/modified files
- [ ] Real purchase test (< $0.50) completes: buy → OTP pending → cancel → refund verified
- [ ] Admin can list all 200+ countries, search, and set price overrides
- [ ] Client sees correct prices (override if exists, otherwise computed from Grizzly live)
- [ ] `providerServiceCost` and `subProviderCost` tables dropped
- [ ] `price_override` table created and functional
- [ ] No regression in existing activation flow

### Must Have
- Shadow pricing resolver with override fallback
- Admin country list with search, filter, and override management
- Real purchase test with cancel + refund flow
- "Mes Numéros" tab showing pending OTP numbers
- Grizzly wrapper utilities (filtering, pagination)
- TDD with test reports

### Must NOT Have (Guardrails)
- NO massive price sync (no `syncPricesFromProvider` with 400K rows)
- NO `providerServiceCost` or `subProviderCost` tables
- NO `console.log` — use structured logger
- NO `any` types
- NO inline styles in `.map()` callbacks
- NO `/index` suffix in imports
- Max ~150 lines per file
- No regression in existing activation/cancel flow
- If Grizzly doesn't refund on cancel → client is NOT refunded

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: bun test
- **Real Purchase Test**: One live test with < $0.50 purchase to verify OTP flow, cancel, refund

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Bash (bun REPL) — Import, call functions, compare output
- **Real Purchase**: Bash (curl) — Execute live purchase, verify OTP pending state, cancel, check refund

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Shared Mocks — ALL agents use these):
├── T0: Shared mock factories + test fixtures [quick]
│   └── Exports: mockGrizzlyClient(), mockDb(), mockOverrides(), mockPricesV3()

Wave 1 (Foundation — types, utils, enhanced client, migration):
├── T1: Grizzly types + utils from wrapper [quick]
├── T2: Enhanced GrizzlyClient with wrapper methods [deep]
├── T3: Database migration (drop old, create price_override) [quick]
└── T4: Pricing Resolver service (shadow pricing core) [deep]

Wave 2 (API layer — all routes in parallel):
├── T5: Admin countries API route [unspecified-high]
├── T6: Admin country overrides API route [unspecified-high]
├── T7: Updated client countries API (shadow pricing) [unspecified-high]
└── T8: Simplified SyncService [deep]

Wave 3 (Admin UI + "Mes Numéros" + actions):
├── T9: Admin countries management page (UI) [visual-engineering]
├── T10: Country pricing server actions [quick]
├── T11: "Mes Numéros" pending OTP tab [visual-engineering]
└── T12: Cancel + refund logic with Grizzly refund check [deep]

Wave 4 (TDD + Real Purchase Test + final verification):
├── T13: TDD test suite for pricing resolver [deep]
├── T14: TDD test suite for admin APIs [unspecified-high]
├── T15: Real purchase test (< $0.50) with cancel + refund [deep]
└── T16: Test reports + coverage verification [quick]

Wave FINAL (4 parallel reviews → user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
```

### Dependency Matrix
- **0**: No deps — starts first, blocks ALL
- **1-4**: Deps on T0 — all start after T0 completes
- **5-8**: Deps on T1, T2, T3, T4
- **9-12**: Deps on T5, T6, T7, T8
- **13-16**: Deps on T1-T12 (all implementation complete)
- **F1-F4**: Deps on T1-T16

### Agent Dispatch Summary
- **Wave 0**: 1 task — T0→`quick`
- **Wave 1**: 4 tasks — T1→`quick`, T2→`deep`, T3→`quick`, T4→`deep`
- **Wave 2**: 4 tasks — T5→`unspecified-high`, T6→`unspecified-high`, T7→`unspecified-high`, T8→`deep`
- **Wave 3**: 4 tasks — T9→`visual-engineering`, T10→`quick`, T11→`visual-engineering`, T12→`deep`
- **Wave 4**: 4 tasks — T13→`deep`, T14→`unspecified-high`, T15→`deep`, T16→`quick`
- **FINAL**: 4 tasks — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [x] 0. Shared Mock Factories + Test Fixtures

  **What to do**:
  - Create `src/services/__mocks__/grizzly.ts` — shared mock factory for GrizzlyClient
    - `mockGrizzlyClient()` → returns object with getCountries, getServicesList, getPricesV3, getPricesV3All, searchPricesV3, getBalance, getNumber, setActivationStatus all returning typed mock data
    - `mockPricesV3Raw()` → realistic Grizzly API response with 3 countries × 2 services
    - `mockCountries()` → 5 GrizzlyCountryItem fixtures (France, USA, Russia, Ukraine, India)
    - `mockServices()` → 5 GrizzlyServiceItem fixtures (whatsapp, telegram, viber, gmail, tiktok)
  - Create `src/services/__mocks__/db.ts` — shared mock factory for Drizzle DB
    - `mockDb()` → returns object with select/insert/update/delete that operates on in-memory arrays
    - `seedOverrides()` → pre-populate with 3 price_override fixtures
    - `seedMappings()` → pre-populate with externalServiceMapping + externalCountryMapping fixtures
  - Create `src/services/__mocks__/fixtures.ts` — typed fixture data used by ALL test files
    - `FIXTURE_COUNTRY_FRANCE`, `FIXTURE_SERVICE_WHATSAPP`, etc.
    - `FIXTURE_OVERRIDE_WHATSAPP_FRANCE` → { serviceSlug: "whatsapp", countryIso: "33", priceCredits: 500 }
  - Export barrel: `src/services/__mocks__/index.ts`
  - Write tests: verify mock factories return correct shapes and data

  **Must NOT do**:
  - Implement any production code
  - Create mocks specific to one task — these must be generic and reusable
  - Use `any` types — all mocks must be fully typed

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure mock factories with fixed data, no complex logic
  - **Skills**: [`tdd-workflow`, `coding-standards`]
    - `tdd-workflow`: Tests first for mock factories
    - `coding-standards`: Follow project conventions

  **Parallelization**:
  - **Can Run In Parallel**: NO — must complete first, blocks ALL other tasks
  - **Parallel Group**: Wave 0 (standalone)
  - **Blocks**: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14
  - **Blocked By**: None

  **References**:
  - `src/services/grizzly/types.ts` — Types to use for mock return values
  - `src/services/grizzly/client.ts` — Methods to mock
  - `src/database/schemas/services.ts` — Table shapes for DB mocks
  - `/home/afreeserv/project/grizzly-wrapper-optimization/src/types.ts` — Wrapper types for mock data

  **Acceptance Criteria**:
  - [x] `src/services/__mocks__/index.ts` exports all mock factories
  - [x] `mockGrizzlyClient()` returns all methods with correct return types
  - [x] `mockDb()` supports select/insert/update/delete on in-memory arrays
  - [x] Fixtures include at least 5 countries, 5 services, 3 overrides
  - [x] `bun test src/services/__mocks__/*.test.ts` → PASS

  **QA Scenarios**:
  ```
  Scenario: Mock GrizzlyClient returns correct country list
    Tool: Bash (bun test)
    Steps:
      1. Import { mockGrizzlyClient } from '@/services/__mocks__'
      2. Call mockGrizzlyClient().getCountries()
      3. Assert: returns array of GrizzlyCountryItem with id, eng, rus, visible
    Expected: Correct typed mock data
    Evidence: .sisyphus/evidence/task-0-mock-client.txt

  Scenario: Mock DB supports insert and select
    Tool: Bash (bun test)
    Steps:
      1. Import { mockDb } from '@/services/__mocks__'
      2. Insert price_override into mock DB
      3. Select from mock DB
      4. Assert: returns inserted row
    Expected: CRUD operations work on in-memory arrays
    Evidence: .sisyphus/evidence/task-0-mock-db.txt
  ```

  **Commit**: YES (standalone)
  - Message: `test: add shared mock factories and test fixtures for Grizzly integration`
  - Files: `src/services/__mocks__/*`
  - Pre-commit: `bun test src/services/__mocks__/*.test.ts`

- [x] 1. Grizzly Types + Utils from Wrapper

  **What to do**:
  - Create `src/services/grizzly/utils.ts` with filtering, pagination, flattening from wrapper
  - Update `src/services/grizzly/types.ts` with complete wrapper type definitions
  - Export: `filterCountries`, `filterServices`, `filterPricesV3`, `flattenPricesV3`, `paginate`, `sortBy`
  - Types: `GrizzlyCountryItem`, `GrizzlyServiceItem`, `PricesV3Raw`, `FlatPriceV3Row`, `PriceV3FilterOptions`, `CountryFilterOptions`, `ServiceFilterOptions`, `PaginationOptions`, `PaginatedResult<T>`
  - Write tests first: test filter functions, paginate, flatten with mock data

  **Must NOT do**:
  - Modify existing GrizzlyClient yet (next task)
  - Add any runtime logic — this is pure functions only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure utility functions with clear input/output, well-defined from wrapper source
  - **Skills**: [`tdd-workflow`, `coding-standards`]
    - `tdd-workflow`: Tests first for all utility functions
    - `coding-standards`: Follow project conventions for pure functions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T2 (needs types), T4 (needs types), T5-T8 (need utils)
  - **Blocked By**: T0 (shared mocks)

  **References**:
  - `/home/afreeserv/project/grizzly-wrapper-optimization/src/types.ts` — Source for all type definitions
  - `/home/afreeserv/project/grizzly-wrapper-optimization/src/utils.ts` — Source for all utility functions
  - `src/services/grizzly/types.ts` — Existing types to extend/replace
  - `src/services/grizzly/prices.ts` — Existing price logic to understand current types
  - `src/services/__mocks__/` — Shared mocks from T0

  **Acceptance Criteria**:
  - [x] `src/services/grizzly/utils.ts` created with all filter/flatten/paginate functions
  - [x] `src/services/grizzly/types.ts` updated with wrapper types (no breaking changes to existing types)
  - [x] `bun test src/services/grizzly/utils.test.ts` → PASS (all filter, flatten, paginate tests)
  - [x] `bun test src/services/grizzly/types.test.ts` → PASS (type safety tests)

  **QA Scenarios**:
  ```
  Scenario: Filter countries by query (French name match)
    Tool: Bash (bun test)
    Steps:
      1. Run bun test src/services/grizzly/utils.test.ts -t "filterCountries"
      2. Assert: filterCountries with query="france" returns country with eng="France"
    Expected: Test passes, correct country returned
    Evidence: .sisyphus/evidence/task-1-filter-countries.txt

  Scenario: Flatten PricesV3 with providers
    Tool: Bash (bun test)
    Steps:
      1. Create mock PricesV3Raw with 2 countries, 3 services, providers
      2. Call flattenPricesV3(mock)
      3. Assert: returns FlatPriceV3Row[] with correct country/service/price/count/providers
    Expected: Correct flattened structure
    Evidence: .sisyphus/evidence/task-1-flatten-v3.txt

  Scenario: Paginate results
    Tool: Bash (bun test)
    Steps:
      1. Create array of 100 items
      2. Call paginate(items, { page: 2, pageSize: 20 })
      3. Assert: data.length === 20, page === 2, totalItems === 100, hasNext === true, hasPrev === true
    Expected: Correct pagination metadata
    Evidence: .sisyphus/evidence/task-1-paginate.txt
  ```

  **Commit**: YES (groups with T2)
  - Message: `feat(grizzly): add wrapper types and utility functions`
  - Files: `src/services/grizzly/types.ts`, `src/services/grizzly/utils.ts`
  - Pre-commit: `bun test src/services/grizzly/utils.test.ts`

- [x] 2. Enhanced GrizzlyClient with Wrapper Methods

  **What to do**:
  - Enhance `src/services/grizzly/client.ts` with wrapper methods:
    - `getCountries()` → returns `GrizzlyCountryItem[]` (already exists, verify it works)
    - `getServicesList()` → returns `GrizzlyServiceItem[]` (already exists)
    - `getPricesV3(country: string, service: string)` → single price lookup
    - `getPricesV3All()` → all prices at once
    - `searchPricesV3(filters)` → paginated search
  - Integrate cache TTL (already exists in client)
  - Add proper error handling with known error codes from wrapper
  - Write tests first with mocked HTTP responses

  **Must NOT do**:
  - Change the BaseService pattern (keep extends BaseService)
  - Remove existing methods (getBalance, getNumber, etc.)
  - Add pricing logic (that's T4's job)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex HTTP client with caching, error handling, multiple API methods
  - **Skills**: [`tdd-workflow`, `backend-patterns`]
    - `tdd-workflow`: Tests first for all new methods
    - `backend-patterns`: Follow service layer patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T4 (needs new methods), T5-T8 (need client methods)
  - **Blocked By**: None (but benefits from T1 types)

  **References**:
  - `/home/afreeserv/project/grizzly-wrapper-optimization/src/client.ts` — Source for all GrizzlySMSClient methods
  - `src/services/grizzly/client.ts` — Existing client to enhance
  - `src/services/grizzly/catalog.ts` — Existing catalog functions to migrate into client
  - `src/services/grizzly/prices.ts` — Existing price functions to migrate into client
  - `src/services/grizzly/cache.ts` — TTLCache already integrated
  - `src/services/base.service.ts` — BaseService pattern to follow

  **Acceptance Criteria**:
  - [x] `GrizzlyClient` has `getCountries()`, `getServicesList()`, `getPricesV3()`, `getPricesV3All()`, `searchPricesV3()`
  - [x] All methods use `this.withRetry()` and `this.httpGet()` from BaseService
  - [x] Cache TTL works (second call returns cached data without HTTP call)
  - [x] `bun test src/services/grizzly/client.test.ts` → PASS (all method tests with mocks)

  **QA Scenarios**:
  ```
  Scenario: getCountries returns parsed country list
    Tool: Bash (bun test)
    Steps:
      1. Mock httpGet to return Grizzly getCountries JSON response
      2. Call client.getCountries()
      3. Assert: returns GrizzlyCountryItem[] with id, eng, rus, visible fields
    Expected: Correct parsing of Grizzly country format
    Evidence: .sisyphus/evidence/task-2-get-countries.txt

  Scenario: getPricesV3 returns price for specific country+service
    Tool: Bash (bun test)
    Steps:
      1. Mock httpGet to return getPricesV3 response for country=78, service=wa
      2. Call client.getPricesV3("78", "wa")
      3. Assert: returns { price, count, providers }
    Expected: Correct price lookup
    Evidence: .sisyphus/evidence/task-2-get-prices-v3.txt

  Scenario: Cache prevents duplicate API calls
    Tool: Bash (bun test)
    Steps:
      1. Mock httpGet with counter
      2. Call client.getCountries() twice
      3. Assert: httpGet called only once
    Expected: Second call returns cached data
    Evidence: .sisyphus/evidence/task-2-cache.txt
  ```

  **Commit**: YES (groups with T1)
  - Message: `feat(grizzly): enhance client with wrapper methods`
  - Files: `src/services/grizzly/client.ts`, `src/services/grizzly/client.test.ts`
  - Pre-commit: `bun test src/services/grizzly/client.test.ts`

- [x] 3. Database Migration — Drop Old Tables, Create price_override

  **What to do**:
  - Create migration: `drizzle/migrations/0002_shadow_pricing.sql`
  - DROP TABLE `provider_service_cost` (if exists, with CASCADE)
  - DROP TABLE `sub_provider_cost` (if exists, with CASCADE)
  - CREATE TABLE `price_override`:
    - `id TEXT PRIMARY KEY`
    - `service_slug TEXT NOT NULL`
    - `country_iso TEXT NOT NULL`
    - `price_credits INTEGER NOT NULL` (manual override price)
    - `floor_credits INTEGER` (optional floor)
    - `note TEXT` (admin note explaining override)
    - `created_at TIMESTAMP DEFAULT NOW()`
    - `updated_at TIMESTAMP DEFAULT NOW()`
    - UNIQUE(service_slug, country_iso)
    - INDEX on service_slug, INDEX on country_iso
  - Update Drizzle schema: `src/database/schemas/services.ts` — replace old tables with `priceOverride`
  - Write migration test: verify tables created/dropped correctly

  **Must NOT do**:
  - Drop `priceRule` table (it stays for now, will be repurposed)
  - Drop `externalServiceMapping` or `externalCountryMapping` (still needed)
  - Drop `provider` table

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SQL migration + schema update, well-defined scope
  - **Skills**: [`tdd-workflow`, `database-migrations`]
    - `tdd-workflow`: Test migration up/down
    - `database-migrations`: Follow migration best practices

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T4 (needs price_override schema), T8 (needs updated schema)
  - **Blocked By**: None

  **References**:
  - `src/database/schemas/services.ts` — Current schema with tables to drop
  - `drizzle/migrations/0001_optimization.sql` — Previous migration for reference
  - `src/database/index.ts` — DB connection for migration runner
  - `drizzle/migrate.ts` — Migration runner (supports $$ dollar-quoting)

  **Acceptance Criteria**:
  - [ ] Migration `0002_shadow_pricing.sql` created and runs without error
  - [ ] `provider_service_cost` and `sub_provider_cost` tables dropped
  - [ ] `price_override` table created with correct columns and indexes
  - [ ] Drizzle schema updated: `priceOverride` exported, old tables removed
  - [ ] Migration rollback (down) works correctly

  **QA Scenarios**:
  ```
  Scenario: Migration runs successfully
    Tool: Bash
    Steps:
      1. Run migration: bun run drizzle/migrate.ts (or equivalent)
      2. Check: \dt in psql shows price_override, no provider_service_cost
    Expected: Migration completes, tables in correct state
    Evidence: .sisyphus/evidence/task-3-migration-up.txt

  Scenario: Schema imports work
    Tool: Bash (bun)
    Steps:
      1. Import { priceOverride } from '@/database/schema'
      2. Assert: priceOverride is a valid Drizzle table
    Expected: No import errors
    Evidence: .sisyphus/evidence/task-3-schema-import.txt
  ```

  **Commit**: YES (standalone)
  - Message: `feat(db): migration for shadow pricing — drop old tables, create price_override`
  - Files: `drizzle/migrations/0002_shadow_pricing.sql`, `src/database/schemas/services.ts`
  - Pre-commit: Verify migration runs

- [x] 4. Pricing Resolver Service (Shadow Pricing Core)

  **What to do**:
  - Create `src/services/pricing-resolver.service.ts` extending BaseService
  - Core method: `resolvePrice(serviceSlug: string, countryIso: string)` → `PriceResult`
    1. SELECT from `price_override` WHERE service_slug = X AND country_iso = Y
    2. If found → return { priceCredits: override.price_credits, source: "override" }
    3. If not found → fetch from Grizzly via `client.getPricesV3(countryIso, serviceSlug)`
       - **CRITICAL: Implement Promise Coalescing** — store inflight Promise in a Map so concurrent requests await the same API call, preventing cache stampede when TTL expires.
    4. Apply margin: `Math.ceil(rawPrice * 2.5 * 650)` → return { priceCredits, source: "computed" }
  - Core method: `resolvePricesForService(serviceSlug: string)` → `PriceResult[]` (all countries)
    1. SELECT all overrides WHERE service_slug = X (batch)
    2. Fetch Grizzly prices for service
    3. Merge: overrides take priority, rest computed
  - Error handling: if Grizzly API down → return cached/stale data or error gracefully
  - Cache: TTL 60s for computed prices (overrides are instant from DB)
  - Write tests first with mocked DB and Grizzly responses

  **Must NOT do**:
  - Call `recalculatePriceRules()` (eliminated)
  - Read from `providerServiceCost` or `subProviderCost` (dropped)
  - Store computed prices in DB (they're dynamic)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core business logic with DB + external API + caching + error handling
  - **Skills**: [`tdd-workflow`, `backend-patterns`]
    - `tdd-workflow`: Tests first for all resolution scenarios
    - `backend-patterns`: Service layer patterns with error handling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T7 (needs resolver), T13 (tests depend on resolver)
  - **Blocked By**: T1 (types), T2 (client methods), T3 (price_override schema)

  **References**:
  - `src/services/grizzly/client.ts` — GrizzlyClient for live price fetching
  - `src/database/schemas/services.ts` — priceOverride table schema
  - `src/common/catalog/services.meta.ts` — SERVICE_REGISTRY for slug↔externalId mapping
  - `app/api/client/services/[slug]/countries/route.ts` — Current price resolution to replace
  - `src/services/base.service.ts` — BaseService pattern

  **Acceptance Criteria**:
  - [ ] `resolvePrice()` returns override when exists, computed when not
  - [ ] `resolvePricesForService()` merges overrides + computed correctly
  - [ ] Grizzly API failure → graceful error (not crash)
  - [ ] Cache works (second call within TTL returns cached computed price)
  - [ ] `bun test src/services/pricing-resolver.service.test.ts` → PASS

  **QA Scenarios**:
  ```
  Scenario: Override price takes priority
    Tool: Bash (bun test)
    Steps:
      1. Mock DB: price_override exists for service="whatsapp", country="78" with price_credits=500
      2. Mock Grizzly: returns raw price 0.10 for country=78, service=wa
      3. Call resolver.resolvePrice("whatsapp", "78")
      4. Assert: returns { priceCredits: 500, source: "override" }
    Expected: Override price used, not computed
    Evidence: .sisyphus/evidence/task-4-override-priority.txt

  Scenario: Computed price when no override
    Tool: Bash (bun test)
    Steps:
      1. Mock DB: no override for service="telegram", country="31"
      2. Mock Grizzly: returns raw price 0.05 for country=31, service=tg
      3. Call resolver.resolvePrice("telegram", "31")
      4. Assert: returns { priceCredits: Math.ceil(0.05 * 2.5 * 650), source: "computed" }
    Expected: Computed price = 82 credits
    Evidence: .sisyphus/evidence/task-4-computed-price.txt

  Scenario: Grizzly API down → graceful error
    Tool: Bash (bun test)
    Steps:
      1. Mock DB: no override
      2. Mock Grizzly: throws network error
      3. Call resolver.resolvePrice("whatsapp", "78")
      4. Assert: returns error result (not thrown exception)
    Expected: Graceful error handling
    Evidence: .sisyphus/evidence/task-4-grizzly-down.txt

  Scenario: Batch resolve for service with mixed overrides
    Tool: Bash (bun test)
    Steps:
      1. Mock DB: 3 overrides for service="whatsapp" (countries 78, 50, 31)
      2. Mock Grizzly: returns prices for 10 countries
      3. Call resolver.resolvePricesForService("whatsapp")
      4. Assert: 3 results with source="override", 7 with source="computed"
    Expected: Correct merge of overrides and computed
    Evidence: .sisyphus/evidence/task-4-batch-resolve.txt
  ```

  **Commit**: YES (groups with T2)
  - Message: `feat(services): add shadow pricing resolver`
  - Files: `src/services/pricing-resolver.service.ts`, `src/services/pricing-resolver.service.test.ts`
  - Pre-commit: `bun test src/services/pricing-resolver.service.test.ts`

- [ ] 5. Admin Countries API Route

  **What to do**:
  - Create `app/api/admin/countries/route.ts`
  - GET: Return ALL countries from static registry + Grizzly live + DB override status
    - Auth: requireAdminSession
    - Rate limit: yes
    - Query params: `q` (search), `page`, `pageSize`, `hasOverride` (filter)
    - Response: `{ items: CountryAdminItem[], total, page, pageSize }`
    - Each item: `{ countryIso, name, icon, hasOverride, overridePriceCredits, grizzlyPriceCredits, availability }`
  - Write tests first

  **Must NOT do**:
  - Expose sensitive data (API keys, provider costs)
  - Allow non-admin access

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API route with auth, rate limiting, complex data aggregation
  - **Skills**: [`tdd-workflow`, `api-design`, `backend-patterns`]
    - `tdd-workflow`: Tests first
    - `api-design`: Proper pagination, filtering, error responses
    - `backend-patterns`: Follow API route pattern from project

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T7, T8)
  - **Blocks**: T9 (admin UI needs this API)
  - **Blocked By**: T1, T2, T3, T4

  **References**:
  - `app/api/admin/services/route.ts` — Existing admin API pattern to follow
  - `app/api/client/services/[slug]/countries/route.ts` — Current countries endpoint to understand data shape
  - `src/common/catalog/services.meta.ts` — getAllCountries() for static registry
  - `src/services/pricing-resolver.service.ts` — For override status lookup
  - `src/middleware/error-handler.ts` — Error handling pattern
  - `src/middleware/rate-limit.ts` — Rate limiting pattern

  **Acceptance Criteria**:
  - [ ] GET /api/admin/countries returns all countries with override status
  - [ ] Search by `q` filters countries by name
  - [ ] Pagination works (page, pageSize, total)
  - [ ] `hasOverride=true` filter returns only countries with manual overrides
  - [ ] Auth required (401 without admin session)
  - [ ] Rate limited

  **QA Scenarios**:
  ```
  Scenario: Admin lists all countries
    Tool: Bash (curl)
    Steps:
      1. curl -H "Cookie: admin-session=..." /api/admin/countries
      2. Assert: status 200, response has items array with countryIso, name, hasOverride fields
    Expected: Returns all 199+ countries from registry
    Evidence: .sisyphus/evidence/task-5-list-countries.json

  Scenario: Search countries by name
    Tool: Bash (curl)
    Steps:
      1. curl /api/admin/countries?q=france
      2. Assert: only France-related countries returned
    Expected: Filtered results
    Evidence: .sisyphus/evidence/task-5-search-countries.json

  Scenario: Unauthorized access blocked
    Tool: Bash (curl)
    Steps:
      1. curl /api/admin/countries (no auth)
      2. Assert: status 401
    Expected: Access denied
    Evidence: .sisyphus/evidence/task-5-unauthorized.txt
  ```

  **Commit**: YES (groups with T6, T7)
  - Message: `feat(api): admin countries endpoint with search and pagination`
  - Files: `app/api/admin/countries/route.ts`
  - Pre-commit: `bun test`

- [ ] 6. Admin Country Overrides API Route

  **What to do**:
  - Create `app/api/admin/countries/[iso]/overrides/route.ts`
  - GET: Get all price overrides for a specific country (across all services)
  - POST: Create/update a price override for a specific service+country
    - Body: `{ serviceSlug, priceCredits, floorCredits?, note? }`
  - DELETE: Remove a price override
    - Body: `{ serviceSlug }`
  - Auth: requireAdminSession
  - Write tests first

  **Must NOT do**:
  - Allow negative prices
  - Allow non-admin access
  - Modify priceRule table (only price_override)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CRUD API with validation, auth, DB operations
  - **Skills**: [`tdd-workflow`, `api-design`]
    - `tdd-workflow`: Tests first
    - `api-design`: Proper REST patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T7, T8)
  - **Blocks**: T9 (admin UI needs this API), T10 (actions use this pattern)
  - **Blocked By**: T1, T2, T3, T4

  **References**:
  - `app/api/admin/price-rules/route.ts` — Existing admin price rules pattern
  - `src/database/schemas/services.ts` — priceOverride table
  - `src/actions/admin.action.ts` — Existing admin action patterns
  - `src/middleware/error-handler.ts` — Error handling

  **Acceptance Criteria**:
  - [ ] GET returns all overrides for a country
  - [ ] POST creates/updates override with validation
  - [ ] DELETE removes override
  - [ ] Zod validation on all inputs
  - [ ] `bun test` passes

  **QA Scenarios**:
  ```
  Scenario: Create price override
    Tool: Bash (curl)
    Steps:
      1. curl -X POST -H "Cookie: admin-session=..." -H "Content-Type: application/json" -d '{"serviceSlug":"whatsapp","priceCredits":600,"note":"Manual override"}' /api/admin/countries/78/overrides
      2. Assert: status 201, returns created override
    Expected: Override created in DB
    Evidence: .sisyphus/evidence/task-6-create-override.json

  Scenario: Delete price override
    Tool: Bash (curl)
    Steps:
      1. curl -X DELETE -H "Cookie: admin-session=..." -H "Content-Type: application/json" -d '{"serviceSlug":"whatsapp"}' /api/admin/countries/78/overrides
      2. Assert: status 200, override removed
    Expected: Override deleted from DB
    Evidence: .sisyphus/evidence/task-6-delete-override.json
  ```

  **Commit**: YES (groups with T5, T7)
  - Message: `feat(api): admin country overrides CRUD endpoint`
  - Files: `app/api/admin/countries/[iso]/overrides/route.ts`
  - Pre-commit: `bun test`

- [ ] 7. Updated Client Countries API (Shadow Pricing)

  **What to do**:
  - Update `app/api/client/services/[slug]/countries/route.ts`
  - Replace current DB-heavy query with shadow pricing resolver
  - New flow:
    1. Auth: requireSession
    2. Rate limit
    3. Get service externalId from slug
    4. Call `pricingResolver.resolvePricesForService(serviceSlug)`
    5. Enrich with country metadata (name, icon) from static registry
    6. Return: `{ items: CountryItem[], total }`
  - Write tests first

  **Must NOT do**:
  - Query `providerServiceCost` or `subProviderCost` (dropped)
  - Use `recalculatePriceRules()` logic
  - Break existing response shape (CountryItem must stay compatible)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API route update with complex data transformation
  - **Skills**: [`tdd-workflow`, `api-design`]
    - `tdd-workflow`: Tests first
    - `api-design`: Maintain backward compatibility

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6, T8)
  - **Blocks**: T11 (client UI depends on this), T15 (real purchase test)
  - **Blocked By**: T1, T2, T3, T4

  **References**:
  - `app/api/client/services/[slug]/countries/route.ts` — Current implementation to replace
  - `src/services/pricing-resolver.service.ts` — New shadow pricing resolver
  - `src/common/catalog/services.meta.ts` — Country metadata lookup
  - `src/type/service.ts` — CountryItem type definition
  - `src/hooks/use-numbers.ts` — useInfiniteCountries hook that calls this API

  **Acceptance Criteria**:
  - [ ] GET returns countries with correct prices (override or computed)
  - [ ] Response shape matches existing CountryItem type
  - [ ] Countries sorted by priceCredits ascending
  - [ ] Performance: < 500ms response time (cache + DB override lookup)
  - [ ] `bun test` passes

  **QA Scenarios**:
  ```
  Scenario: Client gets countries with shadow pricing
    Tool: Bash (curl)
    Steps:
      1. curl -H "Cookie: session=..." /api/client/services/whatsapp/countries
      2. Assert: status 200, items array with countryIso, name, priceCredits, availability
      3. Assert: prices are correct (override or computed)
    Expected: Countries list with correct shadow prices
    Evidence: .sisyphus/evidence/task-7-client-countries.json

  Scenario: Override price reflected in client response
    Tool: Bash (curl)
    Steps:
      1. Create override for whatsapp + France = 600 credits
      2. curl /api/client/services/whatsapp/countries
      3. Assert: France entry has priceCredits=600
    Expected: Override price visible to client
    Evidence: .sisyphus/evidence/task-7-override-visible.json
  ```

  **Commit**: YES (groups with T5, T6)
  - Message: `feat(api): update client countries API to use shadow pricing`
  - Files: `app/api/client/services/[slug]/countries/route.ts`
  - Pre-commit: `bun test`

- [x] 8. Simplified SyncService

  **What to do**:
  - Update `src/services/sync.service.ts`
  - KEEP: `syncExternalMappings()` — syncs services + countries to DB mappings
  - KEEP: `syncProviderBalance()` — syncs Grizzly balance
  - REMOVE: `syncPricesFromProvider()` — no longer needed (shadow pricing)
  - REPLACE: `recalculatePriceRules()` → remove or make no-op
  - Update `src/actions/admin.action.ts` — remove price sync scope from `syncProviderDataAction`
  - Update sync scope enum: only "mappings" and "balance" (remove "prices")
  - Write tests first

  **Must NOT do**:
  - Call `syncPricesFromProvider` anywhere
  - Call `recalculatePriceRules` anywhere
  - Break existing admin sync action (update, don't break)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Service refactoring with dependency analysis across multiple files
  - **Skills**: [`tdd-workflow`, `backend-patterns`]
    - `tdd-workflow`: Tests for remaining methods
    - `backend-patterns`: Service layer patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6, T7)
  - **Blocks**: T9 (admin UI sync buttons), T16 (test reports)
  - **Blocked By**: T1, T2, T3, T4

  **References**:
  - `src/services/sync.service.ts` — Current implementation to simplify
  - `src/actions/admin.action.ts` — Admin sync action to update
  - `src/database/schemas/services.ts` — Updated schema (no providerServiceCost)

  **Acceptance Criteria**:
  - [ ] `syncExternalMappings()` still works (services + countries)
  - [ ] `syncProviderBalance()` still works
  - [ ] `syncPricesFromProvider()` removed
  - [ ] `recalculatePriceRules()` removed or no-op
  - [ ] Admin sync action updated (no "prices" scope)
  - [ ] `bun test src/services/sync.service.test.ts` → PASS

  **QA Scenarios**:
  ```
  Scenario: Sync external mappings works
    Tool: Bash (bun test)
    Steps:
      1. Mock Grizzly client getCountries() and getServicesList()
      2. Mock DB insert
      3. Call syncService.syncExternalMappings("grizzly")
      4. Assert: services and countries inserted into mapping tables
    Expected: Mappings synced correctly
    Evidence: .sisyphus/evidence/task-8-sync-mappings.txt

  Scenario: Sync provider balance works
    Tool: Bash (bun test)
    Steps:
      1. Mock Grizzly client getBalance()
      2. Mock DB update
      3. Call syncService.syncProviderBalance("grizzly")
      4. Assert: provider balance updated
    Expected: Balance synced correctly
    Evidence: .sisyphus/evidence/task-8-sync-balance.txt
  ```

  **Commit**: YES (standalone)
  - Message: `refactor(services): simplify sync service — remove massive price sync`
  - Files: `src/services/sync.service.ts`, `src/actions/admin.action.ts`
  - Pre-commit: `bun test src/services/sync.service.test.ts`

- [ ] 9. Admin Countries Management Page (UI)

  **What to do**:
  - Create `app/[locale]/(admin)/admin/countries/page.tsx`
  - Server Component (no 'use client')
  - Fetch countries from admin API server-side
  - Display: searchable table with country name, icon, override status, price
  - Include inline edit for price override (client component for interactivity)
  - Pagination support
  - Follow project conventions: kebab-case file names, PascalCase components
  - Extract sub-components to `src/component/admin/` (max 150 lines each)

  **Must NOT do**:
  - Add 'use client' to page.tsx
  - Inline styles in .map() callbacks
  - Put business logic in page component
  - Exceed 150 lines per file

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Admin UI page with table, search, pagination, inline editing
  - **Skills**: [`frontend-patterns`, `shadcn-aesthetic`]
    - `frontend-patterns`: Next.js App Router patterns, Server vs Client components
    - `shadcn-aesthetic`: Modern, refined design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T12)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T5, T6, T7, T8

  **References**:
  - `app/[locale]/(admin)/admin/services/page.tsx` — Existing admin page pattern
  - `app/[locale]/(admin)/admin/price-rules/page.tsx` — Existing price rules admin page
  - `src/component/ui/` — UI primitives (button, table, badge, etc.)
  - `src/type/service.ts` — CountryItem type

  **Acceptance Criteria**:
  - [ ] Page renders country list with name, icon, override status, price
  - [ ] Search by country name works
  - [ ] Pagination works
  - [ ] Inline price override editing works
  - [ ] No 'use client' in page.tsx
  - [ ] All sub-components extracted (max 150 lines each)

  **QA Scenarios**:
  ```
  Scenario: Admin countries page renders
    Tool: Playwright
    Steps:
      1. Navigate to /admin/countries (with admin session)
      2. Assert: page loads, country table visible with 20+ countries
      3. Assert: search input present
    Expected: Page renders correctly
    Evidence: .sisyphus/evidence/task-9-page-render.png

  Scenario: Search countries by name
    Tool: Playwright
    Steps:
      1. Navigate to /admin/countries
      2. Type "france" in search input
      3. Assert: only France visible in table
    Expected: Filtered results
    Evidence: .sisyphus/evidence/task-9-search.png

  Scenario: Set price override inline
    Tool: Playwright
    Steps:
      1. Navigate to /admin/countries
      2. Click edit on France row
      3. Enter price 600, save
      4. Assert: price updates to 600, override badge appears
    Expected: Override created and reflected
    Evidence: .sisyphus/evidence/task-9-override.png
  ```

  **Commit**: YES (groups with T10, T11)
  - Message: `feat(admin): countries management page with search and override`
  - Files: `app/[locale]/(admin)/admin/countries/page.tsx`, `src/component/admin/*`
  - Pre-commit: `bun test`

- [ ] 10. Country Pricing Server Actions

  **What to do**:
  - Add to `src/actions/admin.action.ts`:
    - `updateCountryPriceOverrideAction({ countryIso, serviceSlug, priceCredits, note })` → create/update override
    - `deleteCountryPriceOverrideAction({ countryIso, serviceSlug })` → remove override
    - `listCountryOverridesAction({ countryIso })` → get all overrides for a country
  - Follow server action pattern: 'use server', auth check, Zod validation, structured logging
  - Write tests first

  **Must NOT do**:
  - Modify priceRule table
  - Allow non-admin access
  - Skip Zod validation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Server actions follow established pattern, straightforward CRUD
  - **Skills**: [`tdd-workflow`]
    - `tdd-workflow`: Tests first

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T11, T12)
  - **Blocks**: T9 (UI uses these actions), T15 (real purchase test)
  - **Blocked By**: T3, T4

  **References**:
  - `src/actions/admin.action.ts` — Existing admin actions pattern
  - `src/actions/activation.action.ts` — Server action pattern reference
  - `src/database/schemas/services.ts` — priceOverride table
  - `src/services/pricing-resolver.service.ts` — For cache invalidation after override change

  **Acceptance Criteria**:
  - [ ] `updateCountryPriceOverrideAction` creates/updates override
  - [ ] `deleteCountryPriceOverrideAction` removes override
  - [ ] `listCountryOverridesAction` returns overrides for country
  - [ ] All actions require admin auth
  - [ ] Zod validation on all inputs
  - [ ] `bun test` passes

  **QA Scenarios**:
  ```
  Scenario: Create price override via server action
    Tool: Bash (bun test)
    Steps:
      1. Mock admin session
      2. Call updateCountryPriceOverrideAction({ countryIso: "78", serviceSlug: "whatsapp", priceCredits: 600 })
      3. Assert: success: true, override exists in DB
    Expected: Override created
    Evidence: .sisyphus/evidence/task-10-create-override.txt

  Scenario: Unauthorized access blocked
    Tool: Bash (bun test)
    Steps:
      1. Call updateCountryPriceOverrideAction without admin session
      2. Assert: success: false, error: "unauthorized"
    Expected: Access denied
    Evidence: .sisyphus/evidence/task-10-unauthorized.txt
  ```

  **Commit**: YES (groups with T9)
  - Message: `feat(actions): country pricing server actions`
  - Files: `src/actions/admin.action.ts`
  - Pre-commit: `bun test`

- [ ] 11. "Mes Numéros" Pending OTP Tab

  **What to do**:
  - Create `src/component/numbers/pending-activations.tsx` (Client Component)
  - Display activations with state = "waiting" or "pending" (waiting for OTP)
  - Show: service name, country name, phone number, timer (time since request)
  - Actions: Cancel button, Retry button
  - Auto-refresh every 5 seconds for pending activations
  - Use existing `useActivationsList()` hook from `src/hooks/use-numbers.ts`
  - Follow component splitting rules (max 150 lines per file)

  **Must NOT do**:
  - Add business logic in component (use hooks/services)
  - Exceed 150 lines per file
  - Use inline styles in .map() callbacks

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Interactive UI component with polling, actions, real-time updates
  - **Skills**: [`frontend-patterns`, `shadcn-aesthetic`]
    - `frontend-patterns`: React Query patterns, client component patterns
    - `shadcn-aesthetic`: Modern UI design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10, T12)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T5, T6, T7

  **References**:
  - `src/hooks/use-numbers.ts` — useActivationsList hook
  - `src/type/activation.ts` — ActivationInfo type
  - `src/actions/activation.action.ts` — Cancel/retry actions
  - `src/component/numbers/` — Existing number components for pattern reference

  **Acceptance Criteria**:
  - [ ] Pending activations displayed with service, country, phone, timer
  - [ ] Cancel button works (calls cancelActivationAction)
  - [ ] Auto-refresh every 5 seconds for pending items
  - [ ] Empty state shown when no pending activations
  - [ ] Component < 150 lines (split if needed)

  **QA Scenarios**:
  ```
  Scenario: Pending activations displayed
    Tool: Playwright
    Steps:
      1. Navigate to /numbers page with pending activation
      2. Assert: pending activation visible with service, country, phone, timer
    Expected: Correct display
    Evidence: .sisyphus/evidence/task-11-pending-display.png

  Scenario: Cancel pending activation
    Tool: Playwright
    Steps:
      1. Click cancel on pending activation
      2. Assert: activation removed from pending list
      3. Assert: success notification shown
    Expected: Activation cancelled
    Evidence: .sisyphus/evidence/task-11-cancel.png
  ```

  **Commit**: YES (groups with T9)
  - Message: `feat(ui): pending OTP tab in Mes Numéros`
  - Files: `src/component/numbers/pending-activations.tsx`
  - Pre-commit: `bun test`

- [ ] 12. Cancel + Refund Logic with Grizzly Refund Check

  **What to do**:
  - Update `src/actions/activation.action.ts` cancelActivationAction:
    1. Call Grizzly `setActivationStatus(id, -8)` (cancel)
    2. Check Grizzly response for refund status
    3. If Grizzly refunds → mark activation as "cancelled" in DB
    4. If Grizzly does NOT refund → mark as "cancelled_no_refund" (client NOT refunded)
    5. Log the refund decision
  - Update `src/services/activation.service.ts` cancel method
  - Write tests first (mock Grizzly responses for refund/no-refund scenarios)

  **Must NOT do**:
  - Refund client credits if Grizzly didn't refund
  - Change the activation state machine without updating all states
  - Break existing cancel flow

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Critical financial logic with external API dependency and state machine
  - **Skills**: [`tdd-workflow`, `security-review`]
    - `tdd-workflow`: Tests first for all refund scenarios
    - `security-review`: Financial operations need security review

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10, T11)
  - **Blocks**: T15 (real purchase test depends on cancel logic)
  - **Blocked By**: T2 (GrizzlyClient methods), T7 (client API)

  **References**:
  - `src/actions/activation.action.ts` — Current cancel action
  - `src/services/activation.service.ts` — Current activation service
  - `src/services/grizzly/client.ts` — setActivationStatus method
  - `/home/afreeserv/project/grizzly-wrapper-optimization/src/client.ts` — setActivationStatusV2 with final_cost
  - `src/database/schemas/activations.ts` — smsActivation table schema

  **Acceptance Criteria**:
  - [ ] Cancel calls Grizzly API with status -8
  - [ ] If Grizzly refunds → activation = "cancelled", client credits refunded
  - [ ] If Grizzly does NOT refund → activation = "cancelled_no_refund", NO client refund
  - [ ] Refund decision logged with structured logger
  - [ ] `bun test` passes for both scenarios

  **QA Scenarios**:
  ```
  Scenario: Cancel with Grizzly refund
    Tool: Bash (bun test)
    Steps:
      1. Mock Grizzly setActivationStatus returns refund confirmation
      2. Call cancelActivationAction("act_123")
      3. Assert: activation state = "cancelled", client credits refunded
    Expected: Full cancellation with refund
    Evidence: .sisyphus/evidence/task-12-cancel-refund.txt

  Scenario: Cancel without Grizzly refund
    Tool: Bash (bun test)
    Steps:
      1. Mock Grizzly setActivationStatus returns NO refund
      2. Call cancelActivationAction("act_123")
      3. Assert: activation state = "cancelled_no_refund", NO client credit refund
    Expected: Cancelled without refund
    Evidence: .sisyphus/evidence/task-12-cancel-no-refund.txt
  ```

  **Commit**: YES (standalone)
  - Message: `feat(activation): cancel with Grizzly refund check logic`
  - Files: `src/actions/activation.action.ts`, `src/services/activation.service.ts`
  - Pre-commit: `bun test`

- [ ] 13. TDD Test Suite for Pricing Resolver

  **What to do**:
  - Comprehensive test suite for `src/services/pricing-resolver.service.ts`
  - Test all scenarios:
    - Override exists → returns override price
    - No override → computes from Grizzly
    - Grizzly API down → graceful error
    - Batch resolve with mixed overrides
    - Cache behavior (TTL expiry, cache hit)
    - Edge cases: zero price, negative price, missing country
  - Target 90%+ coverage on pricing-resolver.service.ts

  **Must NOT do**:
  - Skip any scenario from the list
  - Use real API calls (mock everything)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive test suite with many scenarios and edge cases
  - **Skills**: [`tdd-workflow`, `python-testing`]
    - `tdd-workflow`: TDD methodology

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T14, T15, T16)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T1-T12 (all implementation)

  **References**:
  - `src/services/pricing-resolver.service.ts` — Code under test
  - `src/services/grizzly/client.ts` — Mock target
  - `src/database/schemas/services.ts` — Mock DB target

  **Acceptance Criteria**:
  - [ ] All 8+ test scenarios pass
  - [ ] 90%+ coverage on pricing-resolver.service.ts
  - [ ] Test report generated: `.sisyphus/evidence/task-13-test-report.txt`

  **QA Scenarios**:
  ```
  Scenario: Full test suite passes
    Tool: Bash (bun test)
    Steps:
      1. Run bun test src/services/pricing-resolver.service.test.ts --coverage
      2. Assert: all tests pass, coverage >= 90%
    Expected: Green tests with high coverage
    Evidence: .sisyphus/evidence/task-13-test-report.txt
  ```

  **Commit**: YES (groups with T14)
  - Message: `test(services): comprehensive pricing resolver test suite`
  - Files: `src/services/pricing-resolver.service.test.ts`
  - Pre-commit: `bun test --coverage`

- [ ] 14. TDD Test Suite for Admin APIs

  **What to do**:
  - Test suite for admin API routes (T5, T6):
    - GET /api/admin/countries — list, search, pagination, auth
    - POST /api/admin/countries/[iso]/overrides — create, validation, auth
    - DELETE /api/admin/countries/[iso]/overrides — delete, auth
  - Use Next.js test utilities or mock fetch
  - Target 80%+ coverage on admin API routes

  **Must NOT do**:
  - Skip auth tests
  - Use real DB (use test DB or mocks)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API testing with auth, validation, multiple endpoints
  - **Skills**: [`tdd-workflow`]
    - `tdd-workflow`: TDD methodology

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T15, T16)
  - **Blocks**: F1-F4
  - **Blocked By**: T1-T12

  **References**:
  - `app/api/admin/countries/route.ts` — Code under test
  - `app/api/admin/countries/[iso]/overrides/route.ts` — Code under test

  **Acceptance Criteria**:
  - [ ] All admin API tests pass
  - [ ] 80%+ coverage on admin API routes
  - [ ] Test report generated: `.sisyphus/evidence/task-14-test-report.txt`

  **QA Scenarios**:
  ```
  Scenario: Full admin API test suite passes
    Tool: Bash (bun test)
    Steps:
      1. Run bun test app/api/admin/ --coverage
      2. Assert: all tests pass, coverage >= 80%
    Expected: Green tests
    Evidence: .sisyphus/evidence/task-14-test-report.txt
  ```

  **Commit**: YES (groups with T13)
  - Message: `test(api): admin API test suite`
  - Files: `app/api/admin/__tests__/`
  - Pre-commit: `bun test --coverage`

- [ ] 15. Real Purchase Test (< $0.50) with Cancel + Refund

  **What to do**:
  - Execute ONE live purchase with real Grizzly API (cost < $0.50)
  - Flow:
    1. Find cheapest available service+country combination
    2. Request activation (real phone number)
    3. Verify activation appears in "pending" state
    4. Cancel the activation
    5. Verify Grizzly refund status
    6. Verify client credit handling (refund or no-refund based on Grizzly)
    7. Generate detailed report of the entire flow
  - Document: timestamps, API responses, DB state changes, credit balance before/after

  **Must NOT do**:
  - Use a service costing > $0.50
  - Skip any step in the flow
  - Leave the activation in a dangling state

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: End-to-end live test with financial implications, multiple API calls, state verification
  - **Skills**: [`tdd-workflow`, `security-review`]
    - `tdd-workflow`: Structured test methodology
    - `security-review`: Financial operation verification

  **Parallelization**:
  - **Can Run In Parallel**: NO (must run after all implementation)
  - **Parallel Group**: Wave 4 (sequential after T13, T14)
  - **Blocks**: F1-F4
  - **Blocked By**: T1-T14

  **References**:
  - `src/actions/activation.action.ts` — Request activation action
  - `src/services/grizzly/client.ts` — Grizzly client for direct API calls
  - `src/services/pricing-resolver.service.ts` — Pricing resolver
  - `src/database/schema` — Activation and credit tables
  - `.env` — Grizzly API key for live calls

  **Acceptance Criteria**:
  - [ ] Activation requested successfully (cost < $0.50)
  - [ ] Activation appears in pending state
  - [ ] Cancel executed successfully
  - [ ] Grizzly refund status verified
  - [ ] Client credit handling correct (matches Grizzly refund decision)
  - [ ] Detailed report saved to `.sisyphus/evidence/task-15-purchase-test.md`

  **QA Scenarios**:
  ```
  Scenario: Full live purchase flow
    Tool: Bash (curl + tmux)
    Steps:
      1. Query cheapest service+country via Grizzly API
      2. Request activation via server action
      3. Verify activation in DB (state = pending)
      4. Wait 10 seconds
      5. Cancel activation
      6. Verify Grizzly refund status
      7. Verify client credit balance change
      8. Save full report
    Expected: Complete flow documented
    Evidence: .sisyphus/evidence/task-15-purchase-test.md
  ```

  **Commit**: NO (test evidence only, no code changes)

- [ ] 16. Test Reports + Coverage Verification

  **What to do**:
  - Run full test suite: `bun test --coverage`
  - Generate coverage report
  - Verify 80%+ coverage on all new/modified files
  - Create summary report: `.sisyphus/evidence/task-16-coverage-report.md`
  - List any files below threshold with recommendations

  **Must NOT do**:
  - Lower the coverage threshold
  - Skip any test file

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Running existing tests and generating reports
  - **Skills**: [`tdd-workflow`]
    - `tdd-workflow`: Coverage methodology

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T14, T15)
  - **Blocks**: F1-F4
  - **Blocked By**: T1-T15

  **Acceptance Criteria**:
  - [ ] `bun test --coverage` passes
  - [ ] 80%+ coverage on all new/modified files
  - [ ] Coverage report saved to `.sisyphus/evidence/task-16-coverage-report.md`

  **QA Scenarios**:
  ```
  Scenario: Full coverage report generated
    Tool: Bash
    Steps:
      1. Run bun test --coverage
      2. Parse coverage output
      3. Verify all new files >= 80%
      4. Save report
    Expected: Coverage report with all files passing threshold
    Evidence: .sisyphus/evidence/task-16-coverage-report.md
  ```

  **Commit**: NO (report only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(grizzly): add wrapper types and utility functions` — types.ts, utils.ts, bun test
- **2**: `feat(grizzly): enhance client with wrapper methods` — client.ts, client.test.ts, bun test
- **3**: `feat(db): migration for shadow pricing` — 0002_shadow_pricing.sql, services.ts
- **4**: `feat(services): add shadow pricing resolver` — pricing-resolver.service.ts + test, bun test
- **5-7**: `feat(api): admin and client API updates` — admin/countries/*, client/services/*, bun test
- **8**: `refactor(services): simplify sync service` — sync.service.ts, admin.action.ts, bun test
- **9-11**: `feat(admin+ui): countries page, actions, pending OTP tab` — admin page, actions, components, bun test
- **12**: `feat(activation): cancel with Grizzly refund check` — activation.action.ts, activation.service.ts, bun test
- **13-14**: `test: comprehensive test suites` — test files, bun test --coverage
- **15**: No commit (evidence only)
- **16**: No commit (report only)

---

## Success Criteria

### Verification Commands
```bash
bun test --coverage          # Expected: 80%+ coverage, all tests passing
bun run db:migrate            # Expected: migration runs cleanly
curl /api/admin/countries     # Expected: 200 with country list
curl /api/client/services/whatsapp/countries  # Expected: 200 with shadow prices
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass with 80%+ coverage
- [ ] Real purchase test completed with full report
- [ ] Shadow pricing working (override + computed)
- [ ] Admin countries page functional
- [ ] "Mes Numéros" pending OTP tab working
- [ ] Cancel + refund logic verified
- [ ] Old tables dropped, new table created
