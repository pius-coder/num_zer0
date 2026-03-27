# APEX Plan: Fapshi SDK Integration

## Overview
We will create a lightweight, type-safe Fapshi SDK in `src/lib/fapshi.ts` that supports payment initialization and status checks. This SDK will use the native `fetch` API and integrate with the project's logging system.

## Prerequisites
- [ ] Obtain Fapshi API Key and API User (Sandbox/Prod)

---

## File Changes

### `src/lib/fapshi.ts` (NEW FILE)
- Implement `FapshiClient` class.
- Methods:
  - `initiatePay(params: InitiatePayParams): Promise<InitiatePayResponse>`
  - `paymentStatus(transId: string): Promise<PaymentStatusResponse>`
- Integration:
  - Use `@/lib/logger` for tracking requests and errors.
  - Load credentials from `process.env`.
- Error Handling:
  - Properly catch and wrap fetch errors or non-200 responses.

### `.env.example` (MODIFY)
- Add `FAPSHI_API_KEY` and `FAPSHI_API_USER` placeholders.

---

## Testing Strategy

**New tests:**
- Create a temporary script `scripts/test-fapshi.ts` to verify the SDK with mock or real sandbox credentials.
- Manually verify that `initiatePay` returns a valid URL and transaction ID.

---

## Acceptance Criteria Mapping

- [ ] AC1: `src/lib/fapshi.ts` implements `initiatePay` and `paymentStatus`.
- [ ] AC2: `.env.example` contains Fapshi keys.
- [ ] AC4: SDK uses `createLogger` and has proper TypeScript interfaces.

---

## Risks & Considerations
- **API Versions**: Documentation links to `v1`. We will follow the provided documentation.
- **Environment**: Ensure the base URL can be toggled via environment variable (Sandbox vs Prod).
