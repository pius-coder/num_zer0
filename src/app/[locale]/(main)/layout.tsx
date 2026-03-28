import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/get-server-session'
import { DesktopHeader } from './_components/desktop-header'
import { MobileBottomNav } from './_components/mobile-bottom-nav'
import { MobileHeader } from './_components/mobile-header'
import { RechargeDrawerProvider } from '@/components/features/recharge'
import SupportFloatingButton from '@/components/features/support/support-floating-button'

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getServerSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  return (
    <RechargeDrawerProvider>
      <div className='flex h-dvh flex-col bg-background'>
        <DesktopHeader locale={locale} />
        <MobileHeader locale={locale} />
        <main className='flex-1 overflow-y-auto'>
          <div className='pb-20 md:pb-8'>{children}</div>
        </main>
        <MobileBottomNav locale={locale} />
        <SupportFloatingButton />
      </div>
    </RechargeDrawerProvider>
  )
}
