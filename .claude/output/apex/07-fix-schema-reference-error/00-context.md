# APEX Task: 07-fix-schema-reference-error

**Created:** 2026-03-28T09:34:00Z
**Task:** fix-schema-reference-error

## Flags
- Auto mode: true
- Save mode: true
- Economy mode: false

## User Request
The newly added Drizzle relations caused a `ReferenceError: Cannot access 'supportMessages' before initialization` due to the relations being defined before the table definitions.

## Acceptance Criteria
- [ ] AC1: Relocate the misordered relations to the bottom of `schema.ts`.
- [ ] AC2: Ensure no other variables are accessed before initialization.
- [ ] AC3: Resolve the 500 status code completely.
