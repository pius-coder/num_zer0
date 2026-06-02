import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MobileBottomNav, BottomNavProvider, DesktopDrawerProxy } from '#/components/layout'

export const Route = createFileRoute('/(app)')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <BottomNavProvider>
      <main>
        <Outlet />
      </main>

      <DesktopDrawerProxy />
      <MobileBottomNav />
    </BottomNavProvider>
  )
}
