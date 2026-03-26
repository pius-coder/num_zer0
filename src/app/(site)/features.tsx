'use client'

import { useTranslations } from 'next-intl'

export default function Features() {
  const t = useTranslations('landing.features')

  const blocks = [
    { k: t('b1k'), title: t('b1t'), body: t('b1d') },
    { k: t('b2k'), title: t('b2t'), body: t('b2d') },
    { k: t('b3k'), title: t('b3t'), body: t('b3d') },
  ]

  return (
    <section id='countries' className='bg-[#080808] py-28 md:py-32'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='mb-12 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {t('label')}
        </h2>

        <div className='overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[#0f0f0f] shadow-elevation-dark'>
          <div className='grid grid-cols-1 md:grid-cols-3'>
            {blocks.map((item, index) => (
              <div
                key={item.k}
                className={`flex flex-col gap-4 p-9 sm:p-11 ${
                  index % 3 !== 2 ? 'md:border-r md:border-[rgba(255,255,255,0.06)]' : ''
                } ${index < 2 ? 'border-b border-[rgba(255,255,255,0.06)] md:border-b-0' : ''}`}
              >
                <p
                  className='text-[11px] font-semibold tabular-nums tracking-[-0.02em] text-[#2563eb]'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {item.k}
                </p>
                <h3
                  className='text-xl font-semibold tracking-[-0.04em] text-zinc-100'
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {item.title}
                </h3>
                <p className='text-[15px] leading-relaxed text-zinc-500'>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
