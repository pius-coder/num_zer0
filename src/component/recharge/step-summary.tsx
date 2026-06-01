'use client'

import type { CreditPackage } from '@/type/credit'
import type { PaymentMethod } from './step-method'
import { CreditCard, Coins, Gift, Shield } from 'lucide-react'

interface StepSummaryProps {
  pkg: CreditPackage
  method: PaymentMethod
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_momo: 'MTN MoMo',
  orange_money: 'Orange Money',
}

const METHOD_COLORS: Record<PaymentMethod, string> = {
  mtn_momo: 'text-yellow-600',
  orange_money: 'text-orange-600',
}

export function StepSummary({ pkg, method }: StepSummaryProps) {
  const bonus = Math.floor((pkg.credits * pkg.bonusPct) / 100)
  const totalCredits = pkg.credits + bonus

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-1'>
        <h3 className='text-lg font-extrabold tracking-tight font-[family-name:var(--font-bricolage-grotesque)]'>
          Récapitulatif
        </h3>
        <p className='text-xs text-muted-foreground'>Vérifiez votre commande avant de payer</p>
      </div>

      <div className='mx-auto max-w-sm overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent shadow-xl shadow-primary/10'>
        <div className='px-6 pt-8 pb-6 text-center'>
          <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-[family-name:var(--font-bricolage-grotesque)]'>
            Vous recevrez
          </p>

          <div className='mt-3 flex items-center justify-center gap-2'>
            <span
              className='
                text-6xl font-black leading-none tracking-tighter text-primary
                font-[family-name:var(--font-geist-mono)]
                sm:text-7xl
              '
            >
              {totalCredits.toLocaleString('fr-FR')}
            </span>
          </div>

          <p className='mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/60'>
            crédits
          </p>

          {bonus > 0 && (
            <div className='mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5'>
              <Coins className='h-3.5 w-3.5 text-primary' />
              <span className='text-xs font-semibold text-primary font-[family-name:var(--font-geist-mono)]'>
                {pkg.credits.toLocaleString('fr-FR')}
              </span>
              <span className='text-xs text-primary/50'>+</span>
              <Gift className='h-3.5 w-3.5 text-primary' />
              <span className='text-xs font-bold text-primary font-[family-name:var(--font-geist-mono)]'>
                {bonus.toLocaleString('fr-FR')} bonus
              </span>
            </div>
          )}
        </div>

        <div className='relative mx-6'>
          <div className='h-px bg-primary/15' />
          <div className='absolute -left-9 -top-3 h-6 w-6 rounded-full bg-background' />
          <div className='absolute -right-9 -top-3 h-6 w-6 rounded-full bg-background' />
        </div>

        <div className='space-y-3.5 px-6 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                <Coins className='h-4 w-4 text-muted-foreground' />
              </div>
              <span className='text-xs font-medium text-muted-foreground'>Forfait</span>
            </div>
            <span className='text-sm font-bold text-foreground font-[family-name:var(--font-bricolage-grotesque)]'>
              {pkg.name}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                <CreditCard className='h-4 w-4 text-muted-foreground' />
              </div>
              <span className='text-xs font-medium text-muted-foreground'>Paiement</span>
            </div>
            <span
              className={`text-sm font-bold font-[family-name:var(--font-bricolage-grotesque)] ${METHOD_COLORS[method]}`}
            >
              {METHOD_LABELS[method]}
            </span>
          </div>

          <div className='h-px bg-border' />

          <div className='flex items-center justify-between'>
            <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              Total à payer
            </span>
            <div className='text-right'>
              <span
                className='
                  text-2xl font-black tracking-tight text-foreground
                  font-[family-name:var(--font-geist-mono)]
                '
              >
                {pkg.priceXaf.toLocaleString('fr-FR')}
              </span>
              <span className='ml-1 text-xs font-medium text-muted-foreground'>FCFA</span>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-sm flex items-center justify-center gap-1.5 rounded-xl bg-muted/50 px-4 py-2.5'>
        <Shield className='h-3.5 w-3.5 text-green-600' />
        <span className='text-[10px] font-medium text-muted-foreground'>
          Paiement sécurisé · Crédits immédiats · Support 24/7
        </span>
      </div>
    </div>
  )
}
