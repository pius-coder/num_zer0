import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/my-space')({
  component: MySpaceLayout,
})

function MySpaceLayout() {
  return <Outlet />
}
