import { createFileRoute } from '@tanstack/react-router'
import { RechargeDrawerProvider, useRechargeDrawer } from '#/components/recharge'
import { Button } from '@/common/ui/button'

export const Route = createFileRoute('/(app)/recharge')({
  ssr: true,
  component: RechargePage,
})

function RechargePage() {
  const { openRecharge } = useRechargeDrawer()

  return (
    <RechargeDrawerProvider>
      <div className="mx-auto max-w-2xl space-y-6 px-3 pb-4 md:px-6 md:pb-8">
        <h1 className="text-xl font-bold">Recharger mes crédits</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un forfait et procédez au paiement.
        </p>
        <Button onClick={() => openRecharge()}>
          Ouvrir le panneau de recharge
        </Button>
      </div>
    </RechargeDrawerProvider>
  )
}
