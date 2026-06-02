'use client'

import { useMemo, useState } from 'react'
import { usePurchases, useBalance } from '@/components/purchases/hooks'
import { useBottomNav } from '@/components/layout/bottom-nav-store'
import { WalletTransactionList, type TransactionItem } from './wallet-transaction-list'
import { WalletBalanceCard } from './wallet-balance-card'

export function WalletPageShell() {
  const { data: purchases } = usePurchases()
  const { data: balanceData } = useBalance()
  const { openPanel } = useBottomNav()
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const balanceUsd = balanceData?.balanceUsd ?? 0

  const transactions = useMemo((): TransactionItem[] => {
    const items = purchases ?? []
    return items.map((p: any) => ({
      id: p._id,
      label: `Recharge ${p.priceXaf} FCFA`,
      date: p.createdAt,
      amountXaf: p.priceXaf,
      kind: 'purchase' as const,
      raw: p,
    }))
  }, [purchases])

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
          onSelectTx={(tx) => setSelectedTx(tx)}
        />
      </div>

      {selectedTx && (
        <div className='fixed inset-0 z-50 flex items-end justify-center md:items-center'>
          <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={() => setSelectedTx(null)} />
          <div className='relative bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 space-y-4'>
            <button
              onClick={() => setSelectedTx(null)}
              className='absolute top-4 right-4 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer'
            >
              Fermer
            </button>
            <h3 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>
              Détails transaction
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Montant</span>
                <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
                  {(selectedTx.amountXaf / 600).toFixed(2)} USD
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>FCFA</span>
                <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
                  {selectedTx.amountXaf.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Date</span>
                <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
                  {new Date(selectedTx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Statut</span>
                <span className='font-figtree text-[#25D366] text-[18px] font-medium tracking-[-0.04em]'>
                  Confirmé
                </span>
              </div>
              {selectedTx.raw?.paymentMethod && (
                <div className='flex justify-between'>
                  <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Méthode</span>
                  <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
                    {selectedTx.raw.paymentMethod}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
