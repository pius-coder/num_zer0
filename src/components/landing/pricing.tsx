'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export default function Pricing({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations('landing.pricing')

  const packs = [
    { coins: '30', price: '500', currency: 'XAF', badge: 'starter' as const },
    { coins: '60', price: '950', currency: 'XAF', badge: null },
    { coins: '180', price: '2 500', currency: 'XAF', badge: 'popular' as const },
    { coins: '600', price: '7 500', currency: 'XAF', badge: null },
    { coins: '1 000', price: '11 500', currency: 'XAF', badge: 'discount' as const },
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

        <div className='grid grid-cols-1 gap-px overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] shadow-elevation-dark sm:grid-cols-2 lg:grid-cols-5'>
          {packs.map((pack) => (
            <div
              key={pack.coins}
              className={cn('relative flex min-h-full flex-col gap-5 bg-[#0f0f0f] p-7 sm:p-9')}
            >
              <div className='flex min-h-[32px] items-start justify-between gap-2'>
                <span
                  className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {pack.coins} {t('coins')}
                </span>
                {pack.badge === 'popular' && (
                  <span
                    className='rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white'
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {t('popular')}
                  </span>
                )}
                {pack.badge === 'discount' && (
                  <span className='rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90'>
                    {t('discount')}
                  </span>
                )}
                {pack.badge === 'starter' && (
                  <span
                    className='rounded-full border border-white/[0.08] bg-[#080808] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500'
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {t('starter')}
                  </span>
                )}
              </div>
              <div>
                <p
                  className='text-3xl font-semibold tabular-nums tracking-[-0.05em] text-zinc-100'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {pack.price}{' '}
                  <span className='text-base font-medium text-zinc-500'>{pack.currency}</span>
                </p>
              </div>
              <div className='mt-auto pt-1'>
                <Button
                  className='h-10 w-full rounded-full border-transparent text-sm font-semibold text-white'
                  style={{ backgroundColor: '#2563eb' }}
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
