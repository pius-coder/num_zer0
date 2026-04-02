'use client'

import { useMemo, useState } from 'react'
import { WalletTransactionTabs } from './wallet-transaction-tabs'
import { WalletTransactionItem } from './wallet-transaction-item'
import { WalletTransactionEmpty } from './wallet-transaction-empty'

export interface TransactionItem {
  id: string
  label: string
  date: string
  amountCredits: number
  kind: 'credit_purchase' | 'number_purchase'
}

interface WalletTransactionListProps {
  transactions?: TransactionItem[]
}

export function WalletTransactionList({ transactions = [] }: WalletTransactionListProps) {
  const [tab, setTab] = useState<'all' | 'credit' | 'numbers'>('all')

  const items = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    if (tab === 'all') return sorted
    if (tab === 'credit') return sorted.filter((tx) => tx.kind === 'credit_purchase')
    return sorted.filter((tx) => tx.kind === 'number_purchase')
  }, [transactions, tab])

  return (
    <div className='space-y-3'>
      <div className='space-y-3'>
        <h2 className='text-base font-semibold'>Historique transactions</h2>
        <WalletTransactionTabs value={tab} onChange={setTab} />
      </div>
      <div className='space-y-2'>
        {items.length === 0 ? (
          <WalletTransactionEmpty />
        ) : (
          items.map((tx) => (
            <WalletTransactionItem
              key={tx.id}
              label={tx.label}
              date={tx.date}
              amountCredits={tx.amountCredits}
              kind={tx.kind}
            />
          ))
        )}
      </div>
    </div>
  )
}
