'use client'

import { memo } from 'react'
import { Check, X, MessageCircle } from 'lucide-react'

interface PaymentConfirmDialogProps {
  packageName: string
  amount: number
  purchaseId: string
  onPaid: () => void
  onNotPaid: () => void
}

const WHATSAPP_NUMBER = '237600000000'

export const PaymentConfirmDialog = memo(function PaymentConfirmDialog({
  packageName,
  amount,
  purchaseId,
  onPaid,
  onNotPaid,
}: PaymentConfirmDialogProps) {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour, j'ai initié un paiement pour le forfait "${packageName}" de ${amount} FCFA (réf: ${purchaseId.slice(-8)}) mais mes crédits ne sont pas apparus. Pouvez-vous vérifier ?`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }

  return (
    <div className='rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4'>
      <div className='flex items-start gap-3'>
        <div className='shrink-0 size-10 rounded-full bg-amber-500/10 flex items-center justify-center'>
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
          className='flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors'
        >
          <Check className='h-4 w-4' />
          Oui, j'ai payé
        </button>
        <button
          type='button'
          onClick={onNotPaid}
          className='flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors'
        >
          <X className='h-4 w-4' />
          Non, annuler
        </button>
      </div>
    </div>
  )
})
