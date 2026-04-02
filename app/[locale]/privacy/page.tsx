import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy | NumZero',
    description: 'Privacy policy and data protection information for NumZero',
  }
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-16 max-w-4xl'>
        <header className='mb-12'>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>{t('title')}</h1>
          <p className='text-lg text-muted-foreground'>{t('description')}</p>
        </header>

        <article className='prose prose-neutral dark:prose-invert max-w-none'>
          <section>
            <h2>{t('intro.title')}</h2>
            <p>{t('intro.content')}</p>
          </section>

          <section>
            <h2>{t('dataCollection.title')}</h2>
            <p>{t('dataCollection.intro')}</p>
            <ul>
              <li>
                <strong>{t('dataCollection.account.title')}</strong>:{' '}
                {t('dataCollection.account.content')}
              </li>
              <li>
                <strong>{t('dataCollection.usage.title')}</strong>:{' '}
                {t('dataCollection.usage.content')}
              </li>
              <li>
                <strong>{t('dataCollection.payment.title')}</strong>:{' '}
                {t('dataCollection.payment.content')}
              </li>
              <li>
                <strong>{t('dataCollection.device.title')}</strong>:{' '}
                {t('dataCollection.device.content')}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t('dataUsage.title')}</h2>
            <p>{t('dataUsage.intro')}</p>
            <ul>
              <li>{t('dataUsage.service')}</li>
              <li>{t('dataUsage.communication')}</li>
              <li>{t('dataUsage.security')}</li>
              <li>{t('dataUsage.improvement')}</li>
            </ul>
          </section>

          <section>
            <h2>{t('dataSharing.title')}</h2>
            <p>{t('dataSharing.intro')}</p>
            <ul>
              <li>
                <strong>{t('dataSharing.providers.title')}</strong>:{' '}
                {t('dataSharing.providers.content')}
              </li>
              <li>
                <strong>{t('dataSharing.legal.title')}</strong>: {t('dataSharing.legal.content')}
              </li>
              <li>
                <strong>{t('dataSharing.business.title')}</strong>:{' '}
                {t('dataSharing.business.content')}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t('cookies.title')}</h2>
            <p>{t('cookies.intro')}</p>
            <ul>
              <li>
                <strong>{t('cookies.essential.title')}</strong>: {t('cookies.essential.content')}
              </li>
              <li>
                <strong>{t('cookies.functional.title')}</strong>: {t('cookies.functional.content')}
              </li>
              <li>
                <strong>{t('cookies.analytics.title')}</strong>: {t('cookies.analytics.content')}
              </li>
            </ul>
          </section>

          <section>
            <h2>{t('rights.title')}</h2>
            <p>{t('rights.intro')}</p>
            <ul>
              <li>
                <strong>{t('rights.access')}</strong>
              </li>
              <li>
                <strong>{t('rights.rectification')}</strong>
              </li>
              <li>
                <strong>{t('rights.erasure')}</strong>
              </li>
              <li>
                <strong>{t('rights.portability')}</strong>
              </li>
              <li>
                <strong>{t('rights.objection')}</strong>
              </li>
            </ul>
          </section>

          <section>
            <h2>{t('security.title')}</h2>
            <p>{t('security.content')}</p>
          </section>

          <section>
            <h2>{t('retention.title')}</h2>
            <p>{t('retention.content')}</p>
          </section>

          <section>
            <h2>{t('children.title')}</h2>
            <p>{t('children.content')}</p>
          </section>

          <section>
            <h2>{t('international.title')}</h2>
            <p>{t('international.content')}</p>
          </section>

          <section>
            <h2>{t('changes.title')}</h2>
            <p>{t('changes.content')}</p>
          </section>

          <section>
            <h2>{t('contact.title')}</h2>
            <p>{t('contact.content')}</p>
            <ul>
              <li>{t('contact.email')}: privacy@numzero.com</li>
            </ul>
          </section>
        </article>

        <footer className='mt-16 pt-8 border-t'>
          <p className='text-sm text-muted-foreground'>
            {t('lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
          <p className='text-sm text-muted-foreground mt-2'>{t('version')}: 1.0</p>
        </footer>
      </div>
    </div>
  )
}
