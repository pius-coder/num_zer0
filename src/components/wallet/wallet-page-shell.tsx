'use client'

import { useWalletBalance, useWalletLedger } from '@/components/wallet/hooks'
import { useXafUsdRate } from '@/components/wallet/hooks'
import { useBottomNav } from '@/components/layout/bottom-nav-store'
import { WalletTransactionList } from './wallet-transaction-list'
import type { TransactionItem } from './wallet-transaction-list'
import { WalletBalanceCard } from './wallet-balance-card'
import { WalletPurchaseHistory } from './wallet-purchase-history'

export function WalletPageShell() {
  const { data: ledgerData } = useWalletLedger()
  const { data: balanceData } = useWalletBalance()
  const { data: rateData } = useXafUsdRate()
  const { openPanel } = useBottomNav()

  const XAF_RATE = rateData?.rate ?? 600
  const balanceUsd = balanceData?.balanceUsd ?? 0

  const mouvements = ledgerData ?? []
  const transactions: TransactionItem[] = mouvements.map((m: any) => ({
    id: m._id,
    label: m.description,
    date: m.createdAt,
    amountXaf: Math.round(m.amountCents / 100 * XAF_RATE),
    credit: m.type === 'credit' || m.type === 'refund' ? m.amountCents / 100 : 0,
    debit: m.type === 'debit' || m.type === 'release' ? m.amountCents / 100 : 0,
    soldeApres: m.balanceAfterCents / 100,
    kind: (m.referenceType === 'escrow' ? 'number_purchase' : 'purchase') as 'purchase' | 'number_purchase',
    statut: 'validee',
  }))

  return (
    <div className="mx-auto max-w-6xl px-3 pb-4 md:px-6 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          Portefeuille
        </h1>
        <button
          onClick={() => openPanel('recharge')}
          className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer"
        >
          + Recharger
        </button>
      </div>

      <WalletBalanceCard balance={balanceUsd} />

      <WalletPurchaseHistory />

      <div className="mt-6">
        <WalletTransactionList
          transactions={transactions}
          onSelectTx={(tx) => openPanel('details', { transaction: tx })}
        />
      </div>
    </div>
  )
}
