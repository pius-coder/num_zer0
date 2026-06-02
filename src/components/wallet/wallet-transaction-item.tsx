'use client'

import { memo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface WalletTransactionItemProps {
  label: string
  date: string
  amountXaf: number
  kind: 'purchase' | 'number_purchase'
  onClick?: () => void
}

export const WalletTransactionItem = memo(function WalletTransactionItem({
  label,
  date,
  amountXaf,
  kind,
  onClick,
}: WalletTransactionItemProps) {
  const isPurchase = kind === 'purchase'

  return (
    <div
      className='p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--line)]/10 transition-colors'
      onClick={onClick}
      role='button'
      tabIndex={0}
    >
      <div className='min-w-0'>
        <p className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] truncate'>{label}</p>
        <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
          {new Date(date).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className='text-right'>
        <p className={`font-figtree text-[18px] font-medium tracking-[-0.04em] leading-[1.25] ${isPurchase ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}>
          {isPurchase ? '+' : '-'}
          {(amountXaf / 600).toFixed(2)} USD
        </p>
        <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
          {amountXaf.toLocaleString('fr-FR')} FCFA
        </p>
        <span className='inline-flex items-center gap-1 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
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
