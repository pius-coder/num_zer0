import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Licenses | NumZero',
    description: 'Third-party licenses and attributions used in NumZero',
  }
}

export default async function LicensesPage() {
  const t = await getTranslations('licenses')

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-16 max-w-4xl'>
        <header className='mb-12'>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>{t('title')}</h1>
          <p className='text-lg text-muted-foreground'>{t('description')}</p>
        </header>

        <section className='prose prose-neutral dark:prose-invert max-w-none'>
          <h2>{t('openSource.title')}</h2>
          <p>{t('openSource.intro')}</p>

          <h3>Next.js</h3>
          <p>
            The React Framework for Production
            <br />
            MIT License - © Vercel, Inc.
          </p>

          <h3>React</h3>
          <p>
            A JavaScript library for building user interfaces
            <br />
            MIT License - © Meta Platforms, Inc.
          </p>

          <h3>Drizzle ORM</h3>
          <p>
            TypeScript ORM for SQL databases
            <br />
            Apache-2.0 License
          </p>

          <h3>Better Auth</h3>
          <p>
            The most comprehensive authentication library for Next.js
            <br />
            MIT License
          </p>

          <h3>Tailwind CSS</h3>
          <p>
            A utility-first CSS framework
            <br />
            MIT License - © Tailwind Labs
          </p>

          <h3>Radix UI</h3>
          <p>
            Unstyled, accessible UI components
            <br />
            MIT License - © Radix UI Team
          </p>

          <h3>next-intl</h3>
          <p>
            Internationalization for Next.js
            <br />
            MIT License
          </p>

          <h3>Zod</h3>
          <p>
            TypeScript-first schema validation
            <br />
            MIT License
          </p>

          <h3>Lucide React</h3>
          <p>
            Beautiful & consistent icons
            <br />
            ISC License
          </p>

          <h2 className='mt-12'>{t('fonts.title')}</h2>
          <p>{t('fonts.intro')}</p>
          <ul>
            <li>
              <strong>Geist</strong> - SIL Open Font License 1.1 - © Vercel
            </li>
          </ul>

          <h2 className='mt-12'>{t('icons.title')}</h2>
          <p>{t('icons.intro')}</p>
          <ul>
            <li>
              <strong>Lucide</strong> - ISC License
            </li>
          </ul>

          <h2 className='mt-12'>{t('attribution.title')}</h2>
          <p>{t('attribution.content')}</p>
        </section>

        <footer className='mt-16 pt-8 border-t'>
          <p className='text-sm text-muted-foreground'>
            {t('lastUpdated')}: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  )
}
