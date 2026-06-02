import { createFileRoute } from '@tanstack/react-router'
import { useBottomNav } from '#/components/layout/bottom-nav-store'

export const Route = createFileRoute('/(app)/recharge')({
  ssr: true,
  component: RechargePage,
})

function RechargePage() {
  const { openPanel } = useBottomNav()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-4 md:px-6 md:pb-8">
      <h1 className="text-xl font-bold">Recharger mes crédits</h1>
      <p className="text-sm text-muted-foreground">
        Choisissez un forfait et procédez au paiement.
      </p>
      <button
        onClick={() => openPanel('recharge')}
        className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer'
      >
        Ouvrir le panneau de recharge
      </button>
    </div>
  )
}
