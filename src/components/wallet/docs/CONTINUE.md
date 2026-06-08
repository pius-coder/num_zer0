# Wallet Feature — CONTINUE.md

## Current state
- Backend (Convex): wallet.ts, payment_intents.ts, escrows.ts, orders.ts, provider_operations.ts deployed and tested
- Frontend hooks: `use-wallet.ts` created with query key factory + hooks for balance, ledger, orders, xaf rate, createPaymentIntent, verifyPaymentIntent

## Next steps
1. Step 11: Update recharge components to use new hooks
2. Step 12: Update wallet page components to use new hooks
3. Step 13: Create admin wallet components

## Known issues
- `cancelPaymentIntent` not exposed as client hook (only internalMutation)
- Escrow mutations are internal-only (called from sms_provider.ts server-side)
- `walletKeys.all` invalidation covers everything (could be more granular)

## Architecture decisions
- `useWalletBalance()` returns `{ balanceCents, balanceUsd, userId }` — balanceUsd for backward compat
- `useWalletLedger()` returns paginated ledger entries (50 at a time)
- `useCreatePaymentIntent` is an action (Fapshi HTTP call), not a mutation
- Optimistic updates NOT used for financial mutations (risk too high)
