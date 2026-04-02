'use client'

import { memo } from 'react'
import { PackageX } from 'lucide-react'

interface WalletTransactionEmptyProps {
  message?: string
}

export const WalletTransactionEmpty = memo(function WalletTransactionEmpty({
  message = 'Aucune transaction pour ce filtre.',
}: WalletTransactionEmptyProps) {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <PackageX className='h-8 w-8 text-muted-foreground/50 mb-3' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  )
})
