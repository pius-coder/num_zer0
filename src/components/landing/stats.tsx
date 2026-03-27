'use client'

import { useTranslations } from 'next-intl'

export default function Stats() {
  const t = useTranslations('landing.stats')

  const items = [
    { value: t('s1'), label: t('l1') },
    { value: t('s2'), label: t('l2') },
    { value: t('s3'), label: t('l3') },
  ]

  return (
    <section id='trust' className='bg-[#080808] py-28 md:py-32'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <div className='overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[#0f0f0f] shadow-elevation-dark'>
          <div className='grid grid-cols-1 divide-y divide-[rgba(255,255,255,0.06)] md:grid-cols-3 md:divide-x md:divide-y-0'>
            {items.map((item) => (
              <div key={item.label} className='flex flex-col gap-3 px-9 py-11 sm:px-11'>
                <p
                  className='text-4xl font-semibold tabular-nums tracking-[-0.06em] text-zinc-100 sm:text-5xl'
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                  }}
                >
                  {item.value}
                </p>
                <p className='text-[15px] text-zinc-500'>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
