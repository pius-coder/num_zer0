# APEX Analysis: Fapshi SDK Integration

## Codebase Context

### Related Files Found
| File | Contains |
|------|----------|
| `src/lib/economics/payment-purchase-service.ts` | Generic purchase lifecycle (pending -> confirmed) |
| `/tmp/fapshi-sdks/nodejs/fapshi.js` | Reference SDK (API calls, headers) |
| `/tmp/fapshi-sdks/nodejs/webhook.js` | Reference webhook verification |

### Patterns Observed
- **Logger**: Uses `@/lib/logger` for system-wide logging.
- **Service Pattern**: Business logic is encapsulated in `Service` classes in `src/lib/economics`.
- **Environment Variables**: API keys should follow existing patterns (likely `FAPSHI_API_KEY`, `FAPSHI_API_USER`).

## Documentation Insights

### Libraries/API
- **Fapshi API**: Base URL `https://api.fapshi.com`.
- **Initiate Pay**: `POST /initiate-pay` returns a `link` for redirection.
- **Authentication**: Requires `apiuser` and `apikey` headers.

## Research Findings

### Common Approaches
- **Integration**: Create a lightweight fetch-based SDK in `src/lib/fapshi.ts`.
- **Usage**: Integrate with `PaymentPurchaseService` to provide a `redirectUrl` for Fapshi.

## Inferred Acceptance Criteria

- [ ] AC1: Create `src/lib/fapshi.ts` supporting `initiatePay` and `paymentStatus`.
- [ ] AC2: Configure environment variables for Fapshi credentials.
- [ ] AC3: (Optional/Bonus) Integrate Fapshi into the `PaymentPurchaseService` or provide a separate utility if requested. (User only asked for the SDK in `lib`).
- [ ] AC4: Ensure SDK is typed and uses the project's logger.
