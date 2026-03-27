'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export default function Pricing({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations('landing.pricing')

  const packs = [
    { id: 'starter', credits: 500, price: 1500, bonusPct: 0, badge: null },
    { id: 'basic', credits: 1000, price: 2750, bonusPct: 5, badge: null },
    { id: 'popular', credits: 2500, price: 6500, bonusPct: 10, badge: 'popular' as const },
    { id: 'value', credits: 5000, price: 12000, bonusPct: 15, badge: 'bestValue' as const },
    { id: 'pro', credits: 10000, price: 22000, bonusPct: 20, badge: null },
    { id: 'business', credits: 25000, price: 50000, bonusPct: 30, badge: null },
    { id: 'enterprise', credits: 50000, price: 90000, bonusPct: 35, badge: 'teams' as const },
  ]

  return (
    <section id='pricing' className='bg-[#080808] py-28 md:py-32'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='mb-12 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {t('label')}
        </h2>
        <div className='mx-auto mb-20 max-w-4xl text-center'>
          <h2
            className='mb-5 text-3xl font-semibold tracking-[-0.04em] text-zinc-100 sm:text-4xl md:text-[2.5rem]'
            style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-1.25px' }}
          >
            {t('title')}
          </h2>
          <p className='text-lg leading-relaxed text-zinc-500'>{t('sub')}</p>
        </div>

        <div className='grid grid-cols-1 gap-px overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] shadow-elevation-dark sm:grid-cols-2 lg:grid-cols-4'>
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={cn('relative flex min-h-full flex-col gap-5 bg-[#0f0f0f] p-7 sm:p-9')}
            >
              <div className='flex min-h-[32px] items-start justify-between gap-2'>
                <span
                  className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#adfa1b]'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {pack.credits.toLocaleString('fr-FR')} {t('coins')}
                </span>
                {pack.badge === 'popular' && (
                  <span
                    className='rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white'
                    style={{ backgroundColor: '#adfa1b' }}
                  >
                    {t('popular')}
                  </span>
                )}
                {pack.badge === 'bestValue' && (
                  <span className='rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90'>
                    {t('bestValue')}
                  </span>
                )}
                {pack.badge === 'teams' && (
                  <span className='rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-300'>
                    {t('teams')}
                  </span>
                )}
              </div>
              <div>
                <p
                  className='text-3xl font-semibold tabular-nums tracking-[-0.05em] text-zinc-100'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {pack.price.toLocaleString('fr-FR')}{' '}
                  <span className='text-base font-medium text-zinc-500'>XAF</span>
                </p>
                <p className='mt-2 text-xs text-zinc-500'>
                  {pack.bonusPct > 0 ? `+ ${pack.bonusPct}% ${t('bonus')}` : t('noBonus')}
                </p>
              </div>
              <div className='mt-auto pt-1'>
                <Button
                  className='h-10 w-full rounded-full border-transparent text-sm font-semibold text-white'
                  style={{ backgroundColor: '#adfa1b' }}
                  render={(props) => (
                    <Link {...props} href={isAuthenticated ? '/my-space' : '/register'}>
                      {isAuthenticated ? t('mySpace') : t('cta')}
                    </Link>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <p className='mx-auto mt-14 max-w-3xl text-center text-sm leading-relaxed text-zinc-600'>
          {t('pay')}
        </p>
      </div>
    </section>
  )
}
