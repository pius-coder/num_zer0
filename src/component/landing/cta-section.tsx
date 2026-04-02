import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/component/ui/button'
import { Link } from '@/i18n/navigation'

export default async function CTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = await getTranslations('landing.cta')

  return (
    <section id='start' className='bg-background px-4 py-28 sm:px-6 md:py-32'>
      <div className='mx-auto max-w-4xl'>
        <h2
          className='mb-12 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {t('label')}
        </h2>
        <div className='mb-14 text-center'>
          <h2
            className='mb-5 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-[2.5rem]'
            style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-1.25px' }}
          >
            {t('title')}
          </h2>
          <p className='text-lg leading-relaxed text-muted-foreground'>{t('sub')}</p>
        </div>
        <div className='mx-auto flex items-center justify-center'>
          <Button
            className='h-11 rounded-full border-transparent bg-primary px-8 text-sm font-semibold text-primary-foreground'
            render={(props) => (
              <Link {...props} href={isAuthenticated ? '/my-space' : '/register'}>
                {isAuthenticated ? t('mySpace') : t('button')}
                <ArrowRight className='h-4 w-4' />
              </Link>
            )}
          />
        </div>
      </div>
    </section>
  )
}
