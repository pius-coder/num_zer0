import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/my-space/$serviceId')({
  component: ServiceLayout,
})

function ServiceLayout() {
  return <Outlet />
}
