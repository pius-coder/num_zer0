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
    <div className='rounded-xl p-5 space-y-4'>
      <div className='flex items-start gap-3'>
        <div className='shrink-0 size-10 rounded-full flex items-center justify-center'>
          <MessageCircle className='size-5 text-amber-500' />
        </div>
        <div className='flex-1'>
          <h4 className='text-sm font-semibold text-foreground'>Paiement non confirmé</h4>
          <p className='text-xs text-muted-foreground mt-1'>
            Nous n'avons pas pu confirmer votre paiement pour{' '}
            <span className='font-medium text-foreground'>{packageName}</span> ({amount} FCFA).
          </p>
        </div>
      </div>

      <div className='text-center py-2'>
        <p className='text-sm font-medium text-foreground'>Avez-vous effectué le paiement ?</p>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <button
          type='button'
          onClick={onPaid}
          className='flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
        >
          <Check className='h-4 w-4' />
          Oui, j'ai payé
        </button>
        <button
          type='button'
          onClick={onNotPaid}
          className='flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors'
        >
          <X className='h-4 w-4' />
          Non, annuler
        </button>
      </div>
    </div>
  )
})
