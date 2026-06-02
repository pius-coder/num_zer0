'use client'

import { useState } from 'react'
import { StepMethod, type PaymentMethod } from './step-method'
import { LoaderCircle } from 'lucide-react'

interface StepTopUpProps {
  initialAmount: number
  onPay: (amount: number, phone: string, method: PaymentMethod, promoCode?: string) => void
  isPending: boolean
}

export function StepTopUp({ initialAmount, onPay, isPending }: StepTopUpProps) {
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [amount, setAmount] = useState(initialAmount)
  const [phone, setPhone] = useState('')
  const [promoCode, setPromoCode] = useState('')

  if (step === 0) {
    return (
      <div className='space-y-5'>
        <StepMethod selected={method} onSelect={(m) => { setMethod(m); setStep(1) }} />
      </div>
    )
  }

  return (
    <div className='space-y-5'>
      <button
        onClick={() => setStep(0)}
        className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer'
      >
        &larr; Retour
      </button>

      <div className='text-center space-y-1'>
        <h3 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>
          Recharger mon solde
        </h3>
        <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
          Minimum 1 500 FCFA
        </p>
      </div>

      <div className='mx-auto max-w-sm space-y-4'>
        <div>
          <label className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider block mb-1'>
            Montant (FCFA)
          </label>
          <input
            type='number'
            min={1500}
            value={amount}
            onChange={(e) => setAmount(Math.max(1500, Number(e.target.value)))}
            className='w-full font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25] text-center outline-none'
          />
          <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider text-center mt-1'>
            ≈ ${(amount / 600).toFixed(2)} USD
          </p>
        </div>

        <div>
          <label className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider block mb-1'>
            Code promo
          </label>
          <input
            type='text'
            placeholder='Saisissez votre code'
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className='w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none uppercase'
          />
        </div>

        <div>
          <label className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider block mb-1'>
            Numéro de téléphone
          </label>
          <input
            type='tel'
            placeholder='6XX XXX XXX'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none'
          />
        </div>

        <button
          onClick={() => method && onPay(amount, phone, method, promoCode || undefined)}
          disabled={!phone || amount < 1500 || isPending}
          className='w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 cursor-pointer disabled:opacity-40'
        >
          {isPending ? (
            <span className='inline-flex items-center gap-2'>
              <LoaderCircle className='h-4 w-4 animate-spin' />
              Traitement...
            </span>
          ) : (
            `Payer ${amount.toLocaleString('fr-FR')} FCFA`
          )}
        </button>
      </div>
    </div>
  )
}
