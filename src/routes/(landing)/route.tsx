import { createFileRoute, Outlet } from '@tanstack/react-router'
import Header from '#/components/landing/header'
import Footer from '#/components/landing/footer'

export const Route = createFileRoute('/(landing)')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
