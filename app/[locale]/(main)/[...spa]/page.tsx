'use client'

import { useParams } from 'next/navigation'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DesktopHeader } from '@/component/layout/desktop-header'
import { MobileHeader } from '@/component/layout/mobile-header-wrapper'
import { MobileBottomNav } from '@/component/layout/mobile-bottom-nav'
import { SupportFloatingButton } from '@/component/support/support-floating-button'
import { RechargeDrawerProvider } from '@/component/recharge/recharge-drawer-provider'
import { MySpacePage } from '@/component/spa/my-space-page'
import { WalletPage } from '@/component/spa/wallet-page'
import { AccountPage } from '@/component/spa/account-page'

export default function SpaRouter() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <BrowserRouter basename={`/${locale}`}>
      <RechargeDrawerProvider>
        <div className='flex h-dvh flex-col bg-background'>
          <DesktopHeader />
          <MobileHeader />
          <main className='flex-1 overflow-y-auto'>
            <div className='pb-20 md:pb-8'>
              <Routes>
                <Route path='/' element={<Navigate to='/my-space' replace />} />
                <Route path='/my-space' element={<MySpacePage />} />
                <Route path='/wallet' element={<WalletPage />} />
                <Route path='/account' element={<AccountPage />} />
                <Route path='/numbers' element={<Navigate to='/my-space?tab=numbers' replace />} />
                <Route path='/recharge' element={<MySpacePage />} />
                <Route path='/support' element={<MySpacePage />} />
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </div>
          </main>
          <MobileBottomNav />
          <SupportFloatingButton />
        </div>
      </RechargeDrawerProvider>
    </BrowserRouter>
  )
}
