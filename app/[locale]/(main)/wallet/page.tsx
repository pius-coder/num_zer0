import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { WalletPageShell } from '@/component/wallet/wallet-page-shell'

export default async function WalletPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense
      fallback={
        <div className='mx-auto max-w-6xl space-y-5 px-3 pb-4 md:px-6 md:pb-8 animate-pulse'>
          <div className='h-32 bg-card rounded-2xl border border-border' />
          <div className='space-y-3'>
            <div className='h-10 bg-card rounded-xl w-48' />
            <div className='grid grid-cols-3 gap-2'>
              <div className='h-9 bg-card rounded-lg' />
              <div className='h-9 bg-card rounded-lg' />
              <div className='h-9 bg-card rounded-lg' />
            </div>
          </div>
        </div>
      }
    >
      <WalletPageShell />
    </Suspense>
  )
}
