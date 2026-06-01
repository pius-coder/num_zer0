'use client'

import { Phone, Mail } from 'lucide-react'

export function SupportOptions() {
  return (
    <div className='space-y-3'>
      <a
        href='https://wa.me/237XXXXXXXXX'
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-card/80 transition-colors'
      >
        <div className='p-1.5 rounded-lg bg-success/20'>
          <Phone className='h-3.5 w-3.5 text-success' />
        </div>
        <div>
          <p className='text-sm font-medium'>WhatsApp</p>
          <p className='text-xs text-muted-foreground'>Réponse rapide</p>
        </div>
      </a>
      <a
        href='mailto:support@numzero.com'
        className='flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-card/80 transition-colors'
      >
        <div className='p-1.5 rounded-lg bg-blue-500/20'>
          <Mail className='h-3.5 w-3.5 text-blue-400' />
        </div>
        <div>
          <p className='text-sm font-medium'>Email</p>
          <p className='text-xs text-muted-foreground'>support@numzero.com</p>
        </div>
      </a>
    </div>
  )
}
