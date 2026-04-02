'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'

interface ConfirmPurchaseSummaryProps {
  serviceName: string
  countryName: string
  availability: number
  priceCredits: number
  isLoading: boolean
  error: string | null
  errorCode?: string
  onConfirm: () => void
}

export const ConfirmPurchaseSummary = memo(function ConfirmPurchaseSummary({
  serviceName,
  countryName,
  availability,
  priceCredits,
  isLoading,
  error,
  errorCode,
  onConfirm,
}: ConfirmPurchaseSummaryProps) {
  return (
    <>
      <div className='rounded-xl bg-muted/50 p-4 mb-4'>
        <div className='flex justify-between text-sm mb-2'>
          <span className='text-muted-foreground'>Service</span>
          <span className='font-medium'>{serviceName}</span>
        </div>
        <div className='flex justify-between text-sm mb-2'>
          <span className='text-muted-foreground'>Pays</span>
          <span className='font-medium'>{countryName}</span>
        </div>
        <div className='flex justify-between text-sm mb-2'>
          <span className='text-muted-foreground'>Disponibles</span>
          <span className='font-medium'>{availability.toLocaleString()}</span>
        </div>
        <div className='border-t my-2' />
        <div className='flex justify-between text-sm'>
          <span className='font-medium'>Prix</span>
          <span className='font-bold text-lg'>{priceCredits} cr</span>
        </div>
      </div>

      <p className='text-[11px] text-muted-foreground mb-4 text-center leading-relaxed'>
        ⏱ Dans les 20 minutes, si le numéro ne reçoit pas de SMS, le coût sera remboursé sur votre
        solde.
      </p>

      <button
        onClick={onConfirm}
        disabled={isLoading}
        className='w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50'
      >
        {isLoading ? <Loader2 className='size-5 animate-spin mx-auto' /> : "Confirmer l'achat"}
      </button>

      {error && (
        <div className='mt-3 space-y-2'>
          <p className='text-xs text-destructive text-center leading-relaxed'>{error}</p>
          {errorCode && (
            <p className='text-[10px] text-muted-foreground font-mono text-center'>{errorCode}</p>
          )}
        </div>
      )}
    </>
  )
})
