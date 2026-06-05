'use client'

import { useEffect, useState } from 'react'
import { useBottomNav } from './bottom-nav-store'
import { RechargeDrawer } from '@/components/recharge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPanel } from '#/common/ui/sheet'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

function DesktopDetailsModal({
  mvt,
  onClose,
}: {
  mvt: Record<string, unknown>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 rounded-2xl w-full max-w-md p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          Fermer
        </button>
        <h3 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          Détails transaction
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Libellé
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right">
              {String(mvt.label ?? '')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Montant
            </span>
            <span
              className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${Number(mvt.credit) > 0 ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}
            >
              {Number(mvt.credit) > 0 ? '+' : '-'}$
              {(Number(mvt.credit) || Number(mvt.debit)).toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              FCFA
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              {Number(mvt.amountXaf).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Solde après
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              ${Number(mvt.soldeApres).toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Date
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              {new Date(String(mvt.date)).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Statut
            </span>
            <span
              className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.statut === 'validee' ? 'text-[#25D366]' : mvt.statut === 'annulee' ? 'text-red-500' : 'text-yellow-500'}`}
            >
              {mvt.statut === 'validee'
                ? 'Validée'
                : mvt.statut === 'annulee'
                  ? 'Annulée'
                  : 'En attente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DesktopDrawerProxy() {
  const { isOpen, activePanel, panelProps, closePanel } = useBottomNav()
  const isDesktop = useIsDesktop()

  if (!isDesktop) return null

  if (activePanel === 'recharge' || activePanel === 'topup') {
    return (
      <RechargeDrawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closePanel()
        }}
        topUpAmount={panelProps.amount as number | undefined}
      />
    )
  }

  if (activePanel === 'choosePrice' && isOpen) {
    return (
      <PriceSheetDesktop
        panelProps={panelProps}
        isOpen={isOpen}
        closePanel={closePanel}
      />
    )
  }

  if (activePanel === 'details' && isOpen) {
    return (
      <DesktopDetailsModal
        mvt={panelProps.transaction as Record<string, unknown>}
        onClose={closePanel}
      />
    )
  }

  return null
}

function PriceSheetDesktop({ panelProps, isOpen, closePanel }: {
  panelProps: Record<string, unknown>
  isOpen: boolean
  closePanel: () => void
}) {
  const { displayPrice: initPrice = 0, defaultPrice, onMaxPriceChange, serviceCount = 0, freePrices } = panelProps as Record<string, any>
  const [localPrice, setLocalPrice] = useState(initPrice)

  const priceTiers = !defaultPrice ? [] : (() => {
    if (freePrices && Object.keys(freePrices).length > 0) {
      return Object.entries(freePrices)
        .map(([priceStr, qty]) => ({ price: parseFloat(priceStr), label: `${qty} pcs` }))
        .sort((a, b) => a.price - b.price)
    }
    const tiers: { price: number; label: string }[] = [{ price: defaultPrice, label: 'Max price' }]
    for (const mult of [0.65, 0.8, 1.0]) {
      const p = Math.round(defaultPrice * mult * 10000) / 10000
      if (p < defaultPrice) tiers.push({ price: p, label: `${Math.floor(serviceCount * (mult > 0.8 ? 0.4 : 0.15))} pcs` })
    }
    tiers.sort((a, b) => a.price - b.price)
    return tiers
  })()
  const formatPrice = (p: number) => p < 1 ? p.toFixed(4) : p.toFixed(2)

  const selectPrice = (price: number) => {
    onMaxPriceChange(price)
    closePanel()
  }

  const handleWheelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const itemHeight = 48
    const index = Math.round((container.scrollTop + 84) / itemHeight)
    const item = priceTiers[index]
    if (item && item.price !== localPrice) {
      setLocalPrice(item.price)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closePanel() }}>
      <SheetContent side="bottom" className="max-w-none rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Choisir le prix</SheetTitle>
          <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider">
            Plus le prix est élevé, plus vous avez de chances d'obtenir le numéro
          </p>
        </SheetHeader>
        <SheetPanel className="space-y-6">
          <div className="relative h-[220px] overflow-hidden">
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-12 -translate-y-1/2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm" />
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0B0B0B] to-transparent z-20" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0B] to-transparent z-20" />
            <div
              onScroll={handleWheelScroll}
              className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[84px]"
              style={{ perspective: '1000px' }}
            >
              {priceTiers.map((tier, i) => {
                const selected = localPrice === tier.price
                return (
                  <button key={i}
                    onClick={() => setLocalPrice(tier.price)}
                    className={`snap-center h-12 w-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      selected ? 'scale-110 text-white' : 'scale-90 text-white/40'
                    }`}
                    style={{
                      transform: selected ? 'scale(1.1)' : 'scale(.9) rotateX(20deg)',
                    }}
                  >
                    <span className="font-figtree text-[18px] font-semibold">${formatPrice(tier.price)}</span>
                    <span className="text-[11px] text-white/50">{tier.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="max-w-sm mx-auto">
            <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider text-center block">Votre prix max</label>
            <div className="flex items-center justify-center gap-3 bg-white/5 rounded-[14px] px-4 py-2 mt-2">
              <button onClick={() => setLocalPrice(Math.max(0.01, Math.round((localPrice - 1) * 100) / 100))}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors">−</button>
              <input type="text" value={`$${localPrice.toFixed(4)}`}
                onChange={(e) => { const v = parseFloat(e.target.value.replace('$', '')); if (!isNaN(v) && v > 0) setLocalPrice(v) }}
                className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] text-center bg-transparent border-none outline-none w-[160px] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <button onClick={() => setLocalPrice(Math.round((localPrice + 1) * 100) / 100)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors">+</button>
            </div>
            <svg className="mx-auto w-[80%] h-[6px] mt-1" viewBox="0 0 200 6" preserveAspectRatio="none" fill="none">
              <path d="M0,3 Q10,0 20,3 T40,3 T60,3 T80,3 T100,3 T120,3 T140,3 T160,3 T180,3 T200,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
            </svg>
            <button
              onClick={() => selectPrice(localPrice)}
              className="w-full mt-4 py-3 rounded-[14px] bg-[#F97316] font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] cursor-pointer hover:brightness-110 transition-all duration-200"
            >
              Confirmer le prix
            </button>
          </div>
        </SheetPanel>
      </SheetContent>
    </Sheet>
  )
}
