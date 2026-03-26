import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function Footer() {
  const t = await getTranslations('landing.footer')

  return (
    <footer className='border-t border-[rgba(255,255,255,0.06)] bg-[#080808] py-14'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <div className='flex flex-col gap-8'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500'>
            <span>{t('line')}</span>
            <span className='text-white/[0.08]' aria-hidden>
              ·
            </span>
            <Link href='/terms' className='font-medium text-zinc-500 hover:text-zinc-200'>
              {t('terms')}
            </Link>
            <span className='text-white/[0.08]' aria-hidden>
              ·
            </span>
            <Link href='/privacy' className='font-medium text-zinc-500 hover:text-zinc-200'>
              {t('privacy')}
            </Link>
            <span className='text-white/[0.08]' aria-hidden>
              ·
            </span>
            <a
              href='mailto:support@numzero.app'
              className='font-medium text-zinc-500 hover:text-zinc-200'
            >
              {t('contact')}
            </a>
          </div>
          <p className='text-xs leading-relaxed text-zinc-600'>{t('legal')}</p>
        </div>
      </div>
    </footer>
  )
}
