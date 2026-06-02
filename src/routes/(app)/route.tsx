import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MobileBottomNav } from '#/components/layout/mobile-bottom-nav'
import { RechargeDrawerProvider } from '#/components/recharge/recharge-drawer-provider'

export const Route = createFileRoute('/(app)')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <RechargeDrawerProvider>
      <main>
        <Outlet />
      </main>

      <MobileBottomNav />
    </RechargeDrawerProvider>
  )
}
