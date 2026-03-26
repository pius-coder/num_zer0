'use client'

import { useTranslations } from 'next-intl'

export default function FAQ() {
  const t = useTranslations('landing.faq')

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
  ]

  return (
    <section
      id='faq'
      className='border-y border-[rgba(255,255,255,0.06)] bg-[#080808] py-28 md:py-32'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <h2
          className='mb-12 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {t('label')}
        </h2>
        <div className='mb-16 text-center'>
          <h2
            className='text-3xl font-semibold tracking-[-0.04em] text-zinc-100 sm:text-4xl md:text-[2.5rem]'
            style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-1.25px' }}
          >
            {t('title')}
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-px overflow-hidden rounded-none border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] shadow-elevation-dark sm:grid-cols-2 lg:grid-cols-3'>
          {faqs.map((faq, index) => (
            <div key={index} className='flex flex-col gap-3 bg-[#0f0f0f] p-7 sm:p-9'>
              <h3
                className='text-[15px] font-semibold tracking-[-0.03em] text-zinc-100'
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {faq.q}
              </h3>
              <p className='text-sm leading-relaxed text-zinc-500'>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
