'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Button } from '@/component/ui/button'
import { ThemeSwitcher } from '@/component/ui/theme-switcher'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/common/css'

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen((open) => !open)

  return (
    <nav className='fixed inset-x-0 top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65'>
      <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6'>
        <Link href='/#hero' className='flex items-center gap-2.5'>
          <div
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground'
            aria-hidden
          >
            N0
          </div>
          <span
            className='text-[15px] font-semibold tracking-[-0.03em] text-foreground'
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            NumZero
          </span>
        </Link>

        <div className='hidden flex-1 items-center justify-center gap-10 md:flex'>
          <Link
            href='/#hero'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('home')}
          </Link>
          <Link
            href='/#credit-model'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('creditModel')}
          </Link>
          <Link
            href='/#how-it-works'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('howItWorks')}
          </Link>
          <Link
            href='/#pricing'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('pricing')}
          </Link>
          <Link
            href='/#trust'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('trust')}
          </Link>
          <Link
            href='/#faq'
            className='text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            {t('faq')}
          </Link>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <ThemeSwitcher />

          <div
            className='hidden items-center rounded-full border border-input p-0.5 sm:flex'
            role='group'
            aria-label={t('langAria')}
          >
            <Link
              href={pathname}
              locale='fr'
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                locale === 'fr'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              FR
            </Link>
            <Link
              href={pathname}
              locale='en'
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                locale === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EN
            </Link>
          </div>

          {isAuthenticated ? (
            <Button
              variant='outline'
              className='hidden h-9 rounded-full border-input bg-transparent px-4 text-sm text-foreground hover:bg-accent sm:inline-flex'
              render={(props) => (
                <Link {...props} href='/my-space'>
                  {t('mySpace')}
                </Link>
              )}
            />
          ) : (
            <>
              <Button
                variant='outline'
                className='hidden h-9 rounded-full border-input bg-transparent px-4 text-sm text-foreground hover:bg-accent sm:inline-flex'
                render={(props) => (
                  <Link {...props} href='/login'>
                    {t('login')}
                  </Link>
                )}
              />
              <Button
                className='hidden h-9 rounded-full border-transparent bg-primary px-4 text-sm font-semibold text-primary-foreground sm:inline-flex'
                render={(props) => (
                  <Link {...props} href='/register'>
                    {t('register')}
                  </Link>
                )}
              />
            </>
          )}

          <button
            type='button'
            onClick={toggleMenu}
            className='inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden'
          >
            <span className='sr-only'>Menu</span>
            {isMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className='border-t border-border bg-background md:hidden'>
          <div className='mx-auto max-w-6xl space-y-0.5 px-4 pb-5 pt-3 sm:px-6'>
            <Link
              href='/#hero'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('home')}
            </Link>
            <Link
              href='/#credit-model'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('creditModel')}
            </Link>
            <Link
              href='/#how-it-works'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('howItWorks')}
            </Link>
            <Link
              href='/#pricing'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('pricing')}
            </Link>
            <Link
              href='/#trust'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('trust')}
            </Link>
            <Link
              href='/#faq'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground'
              onClick={toggleMenu}
            >
              {t('faq')}
            </Link>
            <div className='flex items-center gap-2 px-3 py-3'>
              <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                FR / EN
              </span>
              <div className='flex rounded-full border border-input p-0.5'>
                <Link
                  href={pathname}
                  locale='fr'
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase',
                    locale === 'fr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  FR
                </Link>
                <Link
                  href={pathname}
                  locale='en'
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase',
                    locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  EN
                </Link>
              </div>
            </div>
            {isAuthenticated ? (
              <Button
                variant='outline'
                className='w-full rounded-full border-input bg-transparent text-foreground'
                render={(props) => (
                  <Link {...props} href='/my-space' onClick={toggleMenu}>
                    {t('mySpace')}
                  </Link>
                )}
              />
            ) : (
              <div className='grid gap-2'>
                <Button
                  variant='outline'
                  className='w-full rounded-full border-input bg-transparent text-foreground'
                  render={(props) => (
                    <Link {...props} href='/login' onClick={toggleMenu}>
                      {t('login')}
                    </Link>
                  )}
                />
                <Button
                  className='w-full rounded-full border-transparent bg-primary text-sm font-semibold text-primary-foreground'
                  render={(props) => (
                    <Link {...props} href='/register' onClick={toggleMenu}>
                      {t('register')}
                    </Link>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
