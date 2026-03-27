'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const defaultMethods = [
  { id: 'mtn', label: 'MTN MoMo', detail: '+237 6XX XX XX XX', isDefault: true },
  { id: 'orange', label: 'Orange Money', detail: '+237 6YY YY YY YY', isDefault: false },
  { id: 'card', label: 'Carte bancaire', detail: '•••• 4242', isDefault: false },
]

export function WalletPaymentMethods() {
  return (
    <Card className='border-white/[0.06] bg-card'>
      <CardHeader>
        <CardTitle className='text-base'>Moyens de paiement par défaut</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-2 sm:grid-cols-3'>
        {defaultMethods.map((method) => (
          <div key={method.id} className='rounded-xl border p-3'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium'>{method.label}</p>
              {method.isDefault && <Badge variant='secondary'>Défaut</Badge>}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>{method.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

