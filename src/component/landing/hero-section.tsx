import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { RiFlashlightLine, RiGlobalLine, RiLockLine } from 'react-icons/ri'

import { Button } from '@/component/ui/button'
import { Link } from '@/i18n/navigation'

export default async function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = await getTranslations('landing.hero')

  const badgeParts = t('badges')
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean)

  const badgeIcons = [
    <RiLockLine key='lock' className='mr-1.5 h-3.5 w-3.5 text-primary' />,
    <RiFlashlightLine key='flash' className='mr-1.5 h-3.5 w-3.5 text-primary' />,
    <RiGlobalLine key='global' className='mr-1.5 h-3.5 w-3.5 text-primary' />,
  ]

  return (
    <main
      id='hero'
      className='flex min-h-screen flex-col items-center justify-start bg-background pb-28 pt-40 sm:pb-32 sm:pt-44'
    >
      <div className='mx-auto w-full max-w-6xl px-4 sm:px-6'>
        <div className='overflow-hidden rounded-none border border-border bg-card shadow-elevation-dark'>
          <div className='mx-auto max-w-4xl px-6 py-16 text-center sm:px-12 sm:py-20'>
            <p
              className='mb-8 text-[11px] font-medium uppercase tracking-[0.2em] text-primary'
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {t('tagline')}
            </p>
            <h1
              className='mx-auto max-w-4xl text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.06em] text-foreground sm:text-5xl lg:text-[64px] lg:tracking-[-2.5px]'
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {t('h1')}
            </h1>
            <p className='mx-auto mt-8 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg'>
              {t('sub')}
            </p>
            <div className='mx-auto mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4'>
              <Button
                className='h-11 w-full min-w-[200px] border-transparent bg-primary px-8 text-sm font-semibold text-primary-foreground sm:w-auto'
                render={(props) => (
                  <Link {...props} href={isAuthenticated ? '/my-space' : '/register'}>
                    {isAuthenticated ? t('mySpace') : t('ctaPrimary')}
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                )}
              />
              <Button
                variant='outline'
                className='h-11 w-full min-w-[200px] border-input bg-transparent px-8 text-sm font-medium text-foreground hover:bg-accent sm:w-auto'
                render={(props) => (
                  <Link {...props} href='/#pricing'>
                    {t('ctaSecondary')}
                  </Link>
                )}
              />
            </div>
            <div
              className='mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-2'
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {badgeParts.map((chunk, slice) => (
                <span
                  key={chunk}
                  className='inline-flex items-center rounded-full border border-input bg-surface-subtle px-3 py-1.5 text-[11px] font-medium leading-none text-muted-foreground'
                >
                  {badgeIcons[slice]}
                  {chunk}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className='landing-hero-glow' aria-hidden />
      </div>
    </main>
  )
}
