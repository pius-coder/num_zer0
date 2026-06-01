'use client'

import { Badge } from '@/component/ui/badge'

const defaultMethods = [
  { id: 'mtn', label: 'MTN MoMo', detail: '+237 6XX XX XX XX', isDefault: true },
  { id: 'orange', label: 'Orange Money', detail: '+237 6YY YY YY YY', isDefault: false },
  { id: 'card', label: 'Carte bancaire', detail: '•••• 4242', isDefault: false },
]

export function WalletPaymentMethods() {
  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <h3 className='text-base font-semibold mb-3'>Moyens de paiement par défaut</h3>
      <div className='grid gap-2 sm:grid-cols-3'>
        {defaultMethods.map((method) => (
          <div key={method.id} className='rounded-xl border p-3'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium'>{method.label}</p>
              {method.isDefault && <Badge variant='secondary'>Défaut</Badge>}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>{method.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
