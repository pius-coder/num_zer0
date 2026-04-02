import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function Footer() {
  const t = await getTranslations('landing.footer')

  return (
    <footer className='border-t border-border bg-background py-14'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <div className='flex flex-col gap-8'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground'>
            <span>{t('line')}</span>
            <span className='text-separator' aria-hidden>
              ·
            </span>
            <Link href='/terms' className='font-medium text-muted-foreground hover:text-foreground'>
              {t('terms')}
            </Link>
            <span className='text-separator' aria-hidden>
              ·
            </span>
            <Link
              href='/privacy'
              className='font-medium text-muted-foreground hover:text-foreground'
            >
              {t('privacy')}
            </Link>
            <span className='text-separator' aria-hidden>
              ·
            </span>
            <a
              href='mailto:support@numzero.app'
              className='font-medium text-muted-foreground hover:text-foreground'
            >
              {t('contact')}
            </a>
          </div>
          <p className='text-xs leading-relaxed text-muted-foreground'>{t('legal')}</p>
        </div>
      </div>
    </footer>
  )
}
