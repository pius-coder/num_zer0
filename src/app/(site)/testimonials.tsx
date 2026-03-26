'use client'

import { useTranslations } from 'next-intl'

export default function Testimonials() {
  const t = useTranslations('landing.howItWorks')

  const steps = [
    { k: t('s1k'), title: t('s1t'), body: t('s1d') },
    { k: t('s2k'), title: t('s2t'), body: t('s2d') },
    { k: t('s3k'), title: t('s3t'), body: t('s3d') },
  ]

  return (
    <section id='how-it-works' className='bg-[#080808] py-28 md:py-32'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='mb-12 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {t('label')}
        </h2>
        <div className='mb-16 text-center md:mb-20'>
          <h2
            className='text-3xl font-semibold tracking-[-0.04em] text-zinc-100 sm:text-4xl md:text-[2.5rem] md:leading-tight'
            style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-1.25px' }}
          >
            {t('heading')}
          </h2>
        </div>

        <div className='overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[#0f0f0f] shadow-elevation-dark'>
          <div className='grid grid-cols-1 md:grid-cols-3'>
            {steps.map((step, index) => (
              <div
                key={step.k}
                className={`flex flex-col gap-4 p-9 sm:p-11 ${
                  index < 2 ? 'border-b border-[rgba(255,255,255,0.06)] md:border-b-0' : ''
                } ${index !== 2 ? 'md:border-r md:border-[rgba(255,255,255,0.06)]' : ''}`}
              >
                <p
                  className='text-[11px] font-semibold tabular-nums tracking-[-0.02em] text-[#2563eb]'
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {step.k}
                </p>
                <h3
                  className='text-lg font-semibold tracking-[-0.03em] text-zinc-100'
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {step.title}
                </h3>
                <p className='text-[15px] leading-relaxed text-zinc-500'>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
