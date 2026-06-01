'use client'

import { CheckCircle2 } from 'lucide-react'

export function SupportSuccessView() {
  return (
    <div className='flex flex-col items-center py-8'>
      <CheckCircle2 className='size-12 text-success mb-3' />
      <p className='font-semibold'>Envoyé !</p>
      <p className='text-sm text-muted-foreground mt-1'>Nous vous répondrons bientôt.</p>
    </div>
  )
}
