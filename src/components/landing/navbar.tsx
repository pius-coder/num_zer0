'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const LogoMark = () => (
  <div
    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold tracking-tight text-white'
    style={{ backgroundColor: '#2563eb' }}
    aria-hidden
  >
    N0
  </div>
)

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen((open) => !open)

  const linkClass = 'text-sm font-medium text-zinc-500 hover:text-zinc-100'

  return (
    <nav className='fixed inset-x-0 top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-[#080808]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#080808]/65'>
      <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6'>
        <Link href='/#hero' className='flex items-center gap-2.5'>
          <LogoMark />
          <span
            className='text-[15px] font-semibold tracking-[-0.03em] text-zinc-100'
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            NumZero
          </span>
        </Link>

        <div className='hidden flex-1 items-center justify-center gap-10 md:flex'>
          <Link href='/#hero' className={linkClass}>
            {t('home')}
          </Link>
          <Link href='/#countries' className={linkClass}>
            {t('countries')}
          </Link>
          <Link href='/#pricing' className={linkClass}>
            {t('pricing')}
          </Link>
          <Link href='/#faq' className={linkClass}>
            {t('faq')}
          </Link>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <div
            className='hidden items-center rounded-full border border-white/[0.08] p-0.5 sm:flex'
            role='group'
            aria-label={t('langAria')}
          >
            <Link
              href={pathname}
              locale='fr'
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                locale === 'fr' ? 'bg-[#2563eb] text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              FR
            </Link>
            <Link
              href={pathname}
              locale='en'
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                locale === 'en' ? 'bg-[#2563eb] text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              EN
            </Link>
          </div>

          {isAuthenticated ? (
            <Button
              variant='outline'
              className='hidden h-9 rounded-full border-white/[0.1] bg-transparent px-4 text-sm text-zinc-100 hover:bg-white/[0.04] sm:inline-flex'
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
                className='hidden h-9 rounded-full border-white/[0.1] bg-transparent px-4 text-sm text-zinc-100 hover:bg-white/[0.04] sm:inline-flex'
                render={(props) => (
                  <Link {...props} href='/login'>
                    {t('login')}
                  </Link>
                )}
              />
              <Button
                className='hidden h-9 rounded-full border-transparent px-4 text-sm font-semibold text-white sm:inline-flex'
                style={{ backgroundColor: '#2563eb' }}
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
            className='inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 md:hidden'
          >
            <span className='sr-only'>Menu</span>
            {isMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className='border-t border-[rgba(255,255,255,0.06)] bg-[#080808] md:hidden'>
          <div className='mx-auto max-w-6xl space-y-0.5 px-4 pb-5 pt-3 sm:px-6'>
            <Link
              href='/#hero'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-100'
              onClick={toggleMenu}
            >
              {t('home')}
            </Link>
            <Link
              href='/#countries'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-100'
              onClick={toggleMenu}
            >
              {t('countries')}
            </Link>
            <Link
              href='/#pricing'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-100'
              onClick={toggleMenu}
            >
              {t('pricing')}
            </Link>
            <Link
              href='/#faq'
              className='block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-100'
              onClick={toggleMenu}
            >
              {t('faq')}
            </Link>
            <div className='flex items-center gap-2 px-3 py-3'>
              <span className='text-[11px] font-medium uppercase tracking-wide text-zinc-600'>
                FR / EN
              </span>
              <div className='flex rounded-full border border-white/[0.08] p-0.5'>
                <Link
                  href={pathname}
                  locale='fr'
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase',
                    locale === 'fr' ? 'bg-[#2563eb] text-white' : 'text-zinc-500'
                  )}
                >
                  FR
                </Link>
                <Link
                  href={pathname}
                  locale='en'
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase',
                    locale === 'en' ? 'bg-[#2563eb] text-white' : 'text-zinc-500'
                  )}
                >
                  EN
                </Link>
              </div>
            </div>
            {isAuthenticated ? (
              <Button
                variant='outline'
                className='w-full rounded-full border-white/[0.1] bg-transparent text-zinc-100'
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
                  className='w-full rounded-full border-white/[0.1] bg-transparent text-zinc-100'
                  render={(props) => (
                    <Link {...props} href='/login' onClick={toggleMenu}>
                      {t('login')}
                    </Link>
                  )}
                />
                <Button
                  className='w-full rounded-full border-transparent text-sm font-semibold text-white'
                  style={{ backgroundColor: '#2563eb' }}
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
