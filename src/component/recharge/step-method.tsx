'use client'

import { useCallback } from 'react'
import { PaymentMethodCard } from './payment-method-card'
import { METHODS } from './payment-methods'

export type PaymentMethod = 'mtn_momo' | 'orange_money'

interface StepMethodProps {
  selected: PaymentMethod | null
  onSelect: (m: PaymentMethod) => void
}

export function StepMethod({ selected, onSelect }: StepMethodProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id as PaymentMethod)
    },
    [onSelect]
  )

  return (
    <div className='space-y-5'>
      <div className='text-center space-y-1'>
        <h3 className='text-lg font-extrabold tracking-tight font-[family-name:var(--font-bricolage-grotesque)]'>
          Comment voulez-vous payer ?
        </h3>
        <p className='text-xs text-muted-foreground'>Choisissez votre moyen de paiement préféré</p>
      </div>

      <div className='mx-auto max-w-md space-y-2.5'>
        {METHODS.map((m) => (
          <PaymentMethodCard
            key={m.id}
            id={m.id}
            label={m.label}
            desc={m.desc}
            iconSrc={m.iconSrc}
            iconAlt={m.iconAlt}
            color={m.color}
            activeColor={m.activeColor}
            active={selected === m.id}
            isWallet={false}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
