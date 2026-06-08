# Wallet Feature — TODOS.md

## Step 10 (✅)
- [x] Create `hooks/use-wallet.ts` with `walletKeys` factory + hooks
- [x] Create `hooks/index.ts` barrel export
- [x] Create `docs/CONTINUE.md`, `docs/CHANGELOG.md`, `docs/TODOS.md`

## Step 11 — Adapter flux recharge
- [ ] `recharge-drawer.tsx` → use `useCreatePaymentIntent`
- [ ] `step-topup.tsx` → use query instead of hardcoded 600
- [ ] `recharge-panel.tsx` → update consumer
- [ ] `mobile-bottom-nav.tsx` → update consumer

## Step 12 — Adapter composants wallet
- [ ] `wallet-page-shell.tsx` → use `useWalletBalance` + `useWalletLedger`
- [ ] `wallet-purchase-history.tsx` → use `useOrders`
- [ ] `wallet-transaction-list.tsx` → mapping WalletLedgerEntry
- [ ] `wallet-balance-card.tsx` → adapter props

## Step 13 — Admin wallets
- [ ] `admin-wallets.tsx` → new component
