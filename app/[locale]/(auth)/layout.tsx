import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <div className='relative z-30 flex flex-1 items-center justify-center px-4 pb-24'>
        <div className='w-full max-w-lg px-4'>{children}</div>
      </div>
    </div>
  )
}
