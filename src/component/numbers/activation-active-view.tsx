'use client'

import { memo } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface ActivationActiveViewProps {
  smsCode: string | null
  phoneNumber: string | null
  isLoading: boolean
  isRetryPending: boolean
  isCancelPending: boolean
  retryError: string | null
  onRetry: () => void
  onCancel: () => void
  onDone: () => void
}

export const ActivationActiveView = memo(function ActivationActiveView({
  smsCode,
  phoneNumber,
  isLoading,
  isRetryPending,
  isCancelPending,
  retryError,
  onRetry,
  onCancel,
  onDone,
}: ActivationActiveViewProps) {
  return (
    <>
      <div className='flex flex-col items-center py-4 mb-4'>
        {isLoading ? (
          <>
            <Loader2 className='size-10 animate-spin text-primary mb-4' />
            <p className='text-sm text-muted-foreground'>
              Recherche d&apos;un autre fournisseur...
            </p>
          </>
        ) : smsCode ? (
          <>
            <CheckCircle2 className='size-12 text-success mb-3' />
            <h4 className='font-semibold mb-1'>Code reçu !</h4>
            {phoneNumber && (
              <p className='font-mono font-bold text-lg tracking-wider mb-2'>{phoneNumber}</p>
            )}
            <div className='w-full rounded-xl bg-success/10 border border-success/20 p-4 text-center'>
              <p className='text-xs text-success mb-1'>Code SMS :</p>
              <p className='text-3xl font-mono font-bold tracking-widest text-success'>{smsCode}</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className='size-12 text-success mb-3' />
            <h4 className='font-semibold mb-1'>Numéro attribué !</h4>
            {phoneNumber ? (
              <div className='mt-2 text-center'>
                <p className='text-2xl font-mono font-bold tracking-wider'>{phoneNumber}</p>
                <p className='text-xs text-muted-foreground mt-1'>En attente du SMS...</p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground text-center'>Attribution en cours...</p>
            )}
          </>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        {!smsCode && !isLoading && (
          <>
            <button
              onClick={onRetry}
              disabled={isRetryPending}
              className='w-full rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50'
            >
              {isRetryPending ? (
                <Loader2 className='size-4 animate-spin mx-auto' />
              ) : (
                'Essayer un autre fournisseur'
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isCancelPending}
              className='w-full rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50'
            >
              {isCancelPending ? (
                <Loader2 className='size-4 animate-spin mx-auto' />
              ) : (
                'Annuler et rembourser'
              )}
            </button>
          </>
        )}
        {smsCode && (
          <button
            onClick={onDone}
            className='w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors'
          >
            Terminé
          </button>
        )}
      </div>

      {retryError && <p className='text-xs text-destructive mt-2 text-center'>{retryError}</p>}
    </>
  )
})
