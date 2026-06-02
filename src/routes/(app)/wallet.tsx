import { createFileRoute } from '@tanstack/react-router'
import { WalletPageShell } from '#/components/wallet'

export const Route = createFileRoute('/(app)/wallet')({
  ssr: true,
  component: WalletPageShell,
})
