'use client'

import { useMemo } from 'react'
import { usePurchases } from '@/components/purchases/hooks'
import { useRechargeDrawer } from '@/components/recharge'
import { WalletTransactionList, type TransactionItem } from './wallet-transaction-list'

export function WalletPageShell() {
  const { data: purchases } = usePurchases()
  const { openRecharge } = useRechargeDrawer()

  const transactions = useMemo((): TransactionItem[] => {
    const items = purchases ?? []
    return items.map((p: any) => ({
      id: p._id,
      label: `Forfait ${p.priceXaf} FCFA`,
      date: p.createdAt,
      amountXaf: p.priceXaf,
      kind: 'purchase' as const,
    }))
  }, [purchases])

  return (
    <div className='mx-auto max-w-6xl space-y-5 px-3 pb-4 md:px-6 md:pb-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold'>Mes achats</h1>
        <button
          onClick={() => openRecharge()}
          className='rounded-full px-4 py-2 text-sm font-medium transition-colors'
        >
          + Acheter
        </button>
      </div>

      <div className='space-y-4'>
        <WalletTransactionList transactions={transactions} />
      </div>
    </div>
  )
}
