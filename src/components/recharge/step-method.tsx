'use client'

import { useCallback } from 'react'
import { METHODS } from './payment-methods'

export type PaymentMethod = 'mtn_momo' | 'orange_money'

interface StepMethodProps {
  selected: PaymentMethod | null
  onSelect: (m: PaymentMethod) => void
}

const rotations = ['rotate(2deg)', 'rotate(-2deg)']

export function StepMethod({ selected, onSelect }: StepMethodProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id as PaymentMethod)
    },
    [onSelect],
  )

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h3 className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          Comment voulez-vous payer ?
        </h3>
        <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider">
          Choisissez votre moyen de paiement préféré
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {METHODS.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelect(m.id)}
            className="cursor-pointer transition-transform duration-200 hover:scale-105"
            style={{ transform: rotations[i] }}
          >
            <img
              src={m.iconSrc}
              alt={m.iconAlt}
              width={60}
              height={40}
              className={`rounded-lg w-[52px] md:w-[60px] h-auto ${
                selected === m.id ? 'ring-2 ring-[#F97316]' : ''
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
