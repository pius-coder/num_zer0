import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/recharge')({
  ssr: true,
  loader: () => {
    throw redirect({ to: '/wallet' })
  },
})
