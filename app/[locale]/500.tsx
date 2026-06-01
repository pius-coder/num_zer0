import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/component/ui/button'

export const metadata: Metadata = {
  title: 'Server Error | NumZero',
  description: 'An unexpected error occurred. Please try again later.',
}

export default async function ServerErrorPage() {
  const t = await getTranslations('errors')

  return (
    <html lang='en'>
      <body className='min-h-screen bg-background'>
        <div className='flex min-h-screen flex-col items-center justify-center px-4'>
          <div className='text-center'>
            <h1 className='text-9xl font-bold text-primary'>500</h1>
            <h2 className='mt-4 text-2xl font-semibold text-foreground'>
              {t('serverError.title')}
            </h2>
            <p className='mt-4 text-muted-foreground'>{t('serverError.description')}</p>
            <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center'>
              <Link
                href='/'
                className='inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90'
              >
                {t('serverError.goHome')}
              </Link>
              <Button
                type='button'
                onClick={() => window.location.reload()}
                className='inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted'
              >
                {t('serverError.retry')}
              </Button>
            </div>
            <p className='mt-8 text-sm text-muted-foreground'>
              {t('serverError.contact')}{' '}
              <a href='mailto:support@numzero.app' className='text-primary hover:underline'>
                support@numzero.app
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
