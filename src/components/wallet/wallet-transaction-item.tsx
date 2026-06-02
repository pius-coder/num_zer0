'use client'

import { memo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface WalletTransactionItemProps {
  label: string
  date: string
  amountXaf: number
  kind: 'purchase' | 'number_purchase'
}

export const WalletTransactionItem = memo(function WalletTransactionItem({
  label,
  date,
  amountXaf,
  kind,
}: WalletTransactionItemProps) {
  const isPurchase = kind === 'purchase'

  return (
    <div className='rounded-xl p-3 flex items-center justify-between transition-colors'>
      <div className='min-w-0'>
        <p className='text-sm font-medium truncate'>{label}</p>
        <p className='text-xs text-muted-foreground'>
          {new Date(date).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className='text-right'>
        <p className={`text-sm font-semibold ${isPurchase ? 'text-success' : 'text-amber-300'}`}>
          {isPurchase ? '+' : '-'}
          {amountXaf.toLocaleString('fr-FR')} FCFA
        </p>
        <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
          {isPurchase ? (
            <ArrowDownCircle className='h-3.5 w-3.5' />
          ) : (
            <ArrowUpCircle className='h-3.5 w-3.5' />
          )}
          {isPurchase ? 'Recharge' : 'Numéro'}
        </span>
      </div>
    </div>
  )
})
