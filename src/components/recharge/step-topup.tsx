'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { StepMethod } from './step-method'
import type { PaymentMethod } from './step-method'
import { METHODS } from './payment-methods'
import { LoaderCircle } from 'lucide-react'

const topUpSchema = z.object({
  amount: z.number().min(1500, 'Minimum 1 500 FCFA'),
  phone: z.string().min(1, 'Numéro requis'),
  promoCode: z.string(),
})

type TopUpForm = z.input<typeof topUpSchema>

interface StepTopUpProps {
  initialAmount: number
  onPay: (amount: number, phone: string, method: PaymentMethod, promoCode?: string) => void
  isPending: boolean
}

const XAF_RATE = 600
const QUICK_AMOUNTS_USD = [5, 10, 20, 50]

export function StepTopUp({ initialAmount, onPay, isPending }: StepTopUpProps) {
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState<PaymentMethod | null>(null)

  const { register, handleSubmit, watch, setValue } = useForm<TopUpForm>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      amount: initialAmount,
      phone: '',
      promoCode: '',
    },
  })

  const rawAmount = watch('amount')
  const isValidAmount = typeof rawAmount === 'number' && !isNaN(rawAmount)
  const amount = isValidAmount ? rawAmount : 0

  const phoneValue = watch('phone') ?? ''
  const formValid = !!method && isValidAmount && amount >= 1500 && phoneValue.length > 0

  const onSubmit = (data: TopUpForm) => {
    if (!method) return
    const promo = (data.promoCode ?? '').toUpperCase() || undefined
    onPay(data.amount, data.phone, method, promo)
  }

  if (step === 0) {
    return (
      <div className="space-y-5">
        <StepMethod
          selected={method}
          onSelect={(m) => setMethod(m)}
        />

        <div className="flex justify-center">
          <button
            onClick={() => setStep(1)}
            disabled={!method}
            className="font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] leading-[1.25] py-3 px-8 cursor-pointer disabled:opacity-40 rounded-[14px] bg-[#F97316]"
          >
            Suivant
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <button
        type="button"
        onClick={() => setStep(0)}
        className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
      >
        &larr; Retour
      </button>

      <div className="text-right space-y-1">
        <h3 className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          Recharger mon solde
        </h3>
        <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider">
          Minimum 1 500 FCFA
        </p>
      </div>

      {method && (() => {
        const m = METHODS.find((x) => x.id === method)
        if (!m) return null
        return (
          <div className="flex items-center justify-center gap-2">
            <img src={m.iconSrc} alt={m.iconAlt} className="rounded-lg w-[36px] h-auto" />
            <span className="font-figtree text-white text-[15px] font-semibold">
              {m.label}
            </span>
          </div>
        )
      })()}

      <div className="mx-auto max-w-sm space-y-5">
        {/* Quick-select USD buttons */}
        <div className="flex justify-center gap-2">
          {QUICK_AMOUNTS_USD.map((usd) => {
            const xaf = usd * XAF_RATE
            return (
              <button
                key={usd}
                type="button"
                onClick={() => setValue('amount', xaf, { shouldValidate: true })}
                className={`font-figtree text-[15px] font-semibold tracking-wider px-4 py-1.5 rounded-full cursor-pointer transition-all duration-200 ${
                  amount === xaf
                    ? 'bg-[#F97316] text-white shadow-[0_0_20px_-4px_#F97316]'
                    : 'text-white/65 border border-[#292929] hover:border-white/30 hover:text-white'
                }`}
              >
                ${usd}
              </button>
            )
          })}
        </div>

        {/* Invisible amount input with handwritten underline */}
        <div className="relative">
          <input
            type="number"
            min={1500}
            {...register('amount', { valueAsNumber: true })}
            className="w-full font-figtree text-white text-[30px] font-medium tracking-[-0.04em] leading-[1.25] text-center
              border-none bg-transparent outline-none p-0
              [-moz-appearance:textfield]
              [&::-webkit-inner-spin-button]:appearance-none
              [&::-webkit-outer-spin-button]:appearance-none"
          />
          {/* Handwritten squiggly underline */}
          <svg
            className="w-full h-[6px] mt-1"
            viewBox="0 0 200 6"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,3 Q10,0 20,3 T40,3 T60,3 T80,3 T100,3 T120,3 T140,3 T160,3 T180,3 T200,3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.25"
            />
          </svg>
          <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider text-center mt-1">
            ≈ ${(amount / XAF_RATE).toFixed(2)} USD
          </p>
        </div>

        <div>
          <label className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider block mb-1">
            Code promo
          </label>
          <input
            type="text"
            placeholder="Saisissez votre code"
            {...register('promoCode')}
            className="w-full font-figtree text-white text-[18px] font-medium tracking-[-0.04em] outline-none placeholder:text-white/25 uppercase"
          />
        </div>

        <div>
          <label className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider block mb-1">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            placeholder="6XX XXX XXX"
            {...register('phone', { required: true })}
            className="w-full font-figtree text-white text-[18px] font-medium tracking-[-0.04em] outline-none placeholder:text-white/25"
          />
        </div>

        <button
          type="submit"
          disabled={!formValid || isPending}
          className="w-full font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] leading-[1.25] py-3 cursor-pointer disabled:opacity-40 rounded-[14px] bg-[#F97316] shadow-[0_0_30px_-8px_#F97316]"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Traitement...
            </span>
          ) : (
            `Payer ${amount.toLocaleString('fr-FR')} FCFA`
          )}
        </button>
      </div>
    </form>
  )
}
