'use client'

import { memo } from 'react'
import { Check, X, MessageCircle } from 'lucide-react'

interface PaymentConfirmDialogProps {
  packageName: string
  amount: number
  onPaid: () => void
  onNotPaid: () => void
}

export const PaymentConfirmDialog = memo(function PaymentConfirmDialog({
  packageName,
  amount,
  onPaid,
  onNotPaid,
}: PaymentConfirmDialogProps) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-10 rounded-full flex items-center justify-center">
          <MessageCircle className="size-5 text-[var(--sea-ink-soft)]" />
        </div>
        <div className="flex-1">
          <h4 className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]">
            Paiement non confirmé
          </h4>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mt-1">
            Nous n'avons pas pu confirmer votre paiement pour{' '}
            <span className="text-[var(--sea-ink)]">{packageName}</span> ({amount} FCFA).
          </p>
        </div>
      </div>

      <div className="text-center py-2">
        <p className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]">
          Avez-vous effectué le paiement ?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onPaid}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer"
        >
          <Check className="h-4 w-4" />
          Oui, j'ai payé
        </button>
        <button
          type="button"
          onClick={onNotPaid}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          <X className="h-4 w-4" />
          Non, annuler
        </button>
      </div>
    </div>
  )
})
