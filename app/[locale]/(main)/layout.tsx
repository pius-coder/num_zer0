import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getServerSession } from '@/common/auth/get-server-session'
import { DesktopHeader } from '@/component/layout/desktop-header'
import { MobileHeader } from '@/component/layout/mobile-header-wrapper'
import { MobileBottomNav } from '@/component/layout/mobile-bottom-nav'
import { SupportFloatingButton } from '@/component/support/support-floating-button'
import { RechargeDrawerProvider } from '@/component/recharge/recharge-drawer-provider'

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

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
