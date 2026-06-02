'use client'

import { memo } from 'react'

interface WalletCtaFooterProps {
  onRecharge: () => void
}

export const WalletCtaFooter = memo(function WalletCtaFooter({ onRecharge }: WalletCtaFooterProps) {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      <button
        type='button'
        onClick={onRecharge}
        className='rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
      >
        Recharger des crédits
      </button>
      <a
        href='/my-space'
        className='rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors text-center'
      >
        Parcourir les services
      </a>
    </div>
  )
})
