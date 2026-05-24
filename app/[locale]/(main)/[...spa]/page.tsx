'use client'

import { lazy, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DesktopHeader } from '@/component/layout/desktop-header'
import { MobileHeader } from '@/component/layout/mobile-header-wrapper'
import { MobileBottomNav } from '@/component/layout/mobile-bottom-nav'
import { SupportFloatingButton } from '@/component/support/support-floating-button'
import { RechargeDrawerProvider } from '@/component/recharge/recharge-drawer-provider'

const MySpacePage = lazy(() => import('@/component/spa/my-space-page').then((m) => ({ default: m.MySpacePage })))
const WalletPage = lazy(() => import('@/component/spa/wallet-page').then((m) => ({ default: m.WalletPage })))
const AccountPage = lazy(() => import('@/component/spa/account-page').then((m) => ({ default: m.AccountPage })))

function PageFallback() {
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
    </div>
  )
}

export default function SpaRouter() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <BrowserRouter basename={`/${locale}`}>
      <RechargeDrawerProvider>
        <div className='flex h-dvh flex-col bg-background'>
          <DesktopHeader locale={locale} />
          <MobileHeader locale={locale} />
          <main className='flex-1 overflow-y-auto'>
            <div className='pb-20 md:pb-8'>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path='/' element={<Navigate to='my-space' replace />} />
                  <Route path='my-space' element={<MySpacePage />} />
                  <Route path='wallet' element={<WalletPage />} />
                  <Route path='account' element={<AccountPage />} />
                  <Route path='numbers' element={<Navigate to='my-space?tab=numbers' replace />} />
                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>
          <MobileBottomNav locale={locale} />
          <SupportFloatingButton />
        </div>
      </RechargeDrawerProvider>
    </BrowserRouter>
  )
}
