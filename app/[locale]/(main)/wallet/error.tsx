'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function WalletError({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Wallet page error:', error)
  }, [error])

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4'>
      <div className='rounded-full bg-destructive/10 p-4'>
        <AlertTriangle className='h-8 w-8 text-destructive' />
      </div>
      <div className='text-center space-y-1'>
        <h2 className='text-lg font-semibold text-foreground'>Impossible de charger le wallet</h2>
        <p className='text-sm text-muted-foreground'>
          Une erreur est survenue lors du chargement de vos données.
        </p>
      </div>
      <button
        onClick={reset}
        className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
      >
        <RefreshCw className='h-4 w-4' />
        Réessayer
      </button>
    </div>
  )
}
