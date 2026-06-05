'use client'

import { useBottomNav } from '#/components/layout/bottom-nav-store'

interface PriceStepperProps {
  displayPrice: number
  defaultPrice: number | null
  onMaxPriceChange: (price: number) => void
  serviceCount: number
  freePrices?: Record<string, number>
}

export function PriceStepper({
  displayPrice,
  defaultPrice,
  onMaxPriceChange,
  serviceCount,
  freePrices,
}: PriceStepperProps) {
  const { openPanel } = useBottomNav()

  const formatPrice = (p: number) => (p < 1 ? p.toFixed(4) : p.toFixed(2))

  return (
    <button
      onClick={() =>
        openPanel('choosePrice', {
          displayPrice,
          defaultPrice,
          onMaxPriceChange,
          serviceCount,
          freePrices,
        } as any)
      }
      className="w-full font-figtree text-[15px] font-semibold uppercase tracking-wider flex items-center justify-between px-4 py-[10px] rounded-[18px] bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 ring-1 ring-[var(--line)]/30 cursor-pointer transition-all duration-200 hover:brightness-110"
      style={{
        boxShadow:
          '0 26px 75px rgba(0,0,0,0.42), 0 10px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.03), inset 0 1px 0 var(--inset-glint), inset 1px 0 0 rgba(255,255,255,0.015), inset -1px 0 0 rgba(0,0,0,0.22), inset 0 -1px 0 rgba(0,0,0,0.24)',
      }}
    >
      <span className="text-[var(--sea-ink-soft)]">Choisir le prix</span>
      <span className="text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight ml-3">
        ${formatPrice(displayPrice)}
      </span>
    </button>
  )
}
