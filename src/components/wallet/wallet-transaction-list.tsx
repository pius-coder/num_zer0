'use client'

import { memo } from 'react'

export interface TransactionItem {
  id: string
  label: string
  date: string
  amountXaf: number
  credit: number
  debit: number
  soldeApres: number
  kind: 'purchase' | 'number_purchase'
  statut: string
}

interface WalletTransactionListProps {
  transactions?: TransactionItem[]
  onSelectTx?: (tx: TransactionItem) => void
}

export function WalletTransactionList({
  transactions = [],
  onSelectTx,
}: WalletTransactionListProps) {
  const items = [...transactions]

  return (
    <div className="space-y-1">
      <div className="hidden md:grid grid-cols-5 px-3 py-2 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
        <span>Date</span>
        <span>Libellé</span>
        <span className="text-right">Crédit</span>
        <span className="text-right">Débit</span>
        <span className="text-right">Statut</span>
      </div>
      {items.length === 0 ? (
        <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider px-3 py-4">
          Aucune transaction
        </p>
      ) : (
        items.map((tx) => (
          <WalletTransactionItem
            key={tx.id}
            label={tx.label}
            date={tx.date}
            credit={tx.credit}
            debit={tx.debit}
            statut={tx.statut}
            onClick={() => onSelectTx?.(tx)}
          />
        ))
      )}
    </div>
  )
}

interface WalletTransactionItemProps {
  label: string
  date: string
  credit: number
  debit: number
  statut: string
  onClick?: () => void
}

export const WalletTransactionItem = memo(function WalletTransactionItem({
  label,
  date,
  credit,
  debit,
  statut,
  onClick,
}: WalletTransactionItemProps) {
  const statutLabel =
    statut === 'validee' ? 'Validée' : statut === 'annulee' ? 'Annulée' : 'En attente'

  return (
    <div
      className="p-3 flex flex-col md:grid md:grid-cols-5 gap-1 cursor-pointer hover:bg-[var(--line)]/10 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
        {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
      </span>
      <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] truncate">
        {label}
      </span>
      <span className="font-figtree text-[#25D366] text-[18px] font-medium tracking-[-0.04em] text-right tabular-nums">
        {credit > 0 ? `+${credit.toFixed(2)}` : '-'}
      </span>
      <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right tabular-nums">
        {debit > 0 ? `${debit.toFixed(2)}` : '-'}
      </span>
      <span
        className={`font-figtree text-[15px] font-semibold uppercase tracking-wider text-right ${
          statut === 'validee'
            ? 'text-[#25D366]'
            : statut === 'annulee'
              ? 'text-red-500'
              : 'text-yellow-500'
        }`}
      >
        {statutLabel}
      </span>
    </div>
  )
})
