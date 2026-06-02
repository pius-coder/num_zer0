'use client'

import { useMouvements, useBalance } from '@/components/purchases/hooks'
import { useBottomNav } from '@/components/layout/bottom-nav-store'
import { WalletTransactionList, type TransactionItem } from './wallet-transaction-list'
import { WalletBalanceCard } from './wallet-balance-card'

export function WalletPageShell() {
  const { data: mouvements } = useMouvements()
  const { data: balanceData } = useBalance()
  const { openPanel } = useBottomNav()

  const balanceUsd = balanceData?.balanceUsd ?? 0

  const transactions: TransactionItem[] = (mouvements ?? []).map((m: any) => ({
    id: m.id,
    label: m.libelle,
    date: m.date,
    amountXaf: Math.round(m.montant * 600),
    credit: m.sens === 'debit' ? m.montant : 0,
    debit: m.sens === 'credit' ? m.montant : 0,
    soldeApres: m.soldeApres,
    kind: 'purchase' as const,
    statut: m.statut,
  }))

  return (
    <div className='mx-auto max-w-6xl px-3 pb-4 md:px-6 md:pb-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>Portefeuille</h1>
        <button
          onClick={() => openPanel('recharge')}
          className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer'
        >
          + Recharger
        </button>
      </div>

      <WalletBalanceCard balance={balanceUsd} />

      <div className='mt-6'>
        <WalletTransactionList
          transactions={transactions}
          onSelectTx={(tx) => openPanel('details', { transaction: tx })}
        />
      </div>
    </div>
  )
}