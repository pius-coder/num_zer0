# APEX Task: 06-fix-messages-flow

**Created:** 2026-03-28T09:18:16Z
**Task:** fix-messages flow

## Flags
- Auto mode: true
- Save mode: true
- Economy mode: false

## User Request
The user reported a `TypeError: Cannot read properties of undefined (reading 'referencedTable')` in the admin dashboard and my-space message flow. Multiple 500 errors are occurring.

## Acceptance Criteria
- [ ] AC1: Identify the source of the `TypeError: referencedTable`.
- [ ] AC2: Fix the schema or action logic causing the failure.
- [ ] AC3: Verify that messages are successfully sent and received without 500 errors.
- [ ] AC4: Ensure the admin dashboard correctly displays messages without crashing.
