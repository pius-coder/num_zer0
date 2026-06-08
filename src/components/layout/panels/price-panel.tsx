'use client'

import { useState, useRef, useEffect } from 'react'
import { useBottomNav } from '../bottom-nav-store'

export function PricePanel() {
  const { panelProps, closePanel } = useBottomNav()
  const {
    displayPrice: initPrice,
    defaultPrice,
    onMaxPriceChange,
    serviceCount,
    freePrices,
  } = panelProps as Record<string, any>
  const [localPrice, setLocalPrice] = useState(initPrice)

  // AJOUT : Références et état pour suivre la position exacte du scroll en continu
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(84) 
  const isProgrammaticScroll = useRef(false)

  const itemHeight = 48 // Correspond à h-12

  const priceTiers = !defaultPrice
    ? []
    : (() => {
        if (freePrices && Object.keys(freePrices).length > 0) {
          return Object.entries(freePrices)
            .map(([priceStr, qty]) => ({
              price: parseFloat(priceStr),
              label: `${qty} pcs`,
            }))
            .sort((a, b) => a.price - b.price)
        }
        const tiers = [{ price: defaultPrice, label: 'Max price' }]
        for (const mult of [0.65, 0.8, 1.0]) {
          const p = Math.round(defaultPrice * mult * 10000) / 10000
          if (p < defaultPrice) {
            tiers.push({
              price: p,
              label: `${Math.floor(serviceCount * (mult > 0.8 ? 0.4 : 0.15))} pcs`,
            })
          }
        }
        tiers.sort((a, b) => a.price - b.price)
        return tiers
      })()

  const formatPrice = (p: number) => (p < 1 ? p.toFixed(4) : p.toFixed(2))

  const selectPrice = (price: number) => {
    onMaxPriceChange(price)
    closePanel()
  }

  // MODIFICATION : Écouteur de scroll amélioré pour l'effet 3D en temps réel
  const handleWheelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    setScrollTop(container.scrollTop) // Met à jour la position pour animer la 3D

    if (isProgrammaticScroll.current) return

    const index = Math.round(container.scrollTop / itemHeight)
    const item = priceTiers[index]
    if (item && item.price !== localPrice) {
      setLocalPrice(item.price)
    }
  }

  // AJOUT : Synchronise la position de la roue lorsque le prix change via l'input ou les boutons + / -
  useEffect(() => {
    const targetIndex = priceTiers.findIndex((t) => t.price === localPrice)
    if (targetIndex !== -1 && scrollContainerRef.current) {
      const targetScroll = targetIndex * itemHeight
      if (Math.abs(scrollContainerRef.current.scrollTop - targetScroll) > 1) {
        isProgrammaticScroll.current = true
        scrollContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        })
        setScrollTop(targetScroll)
        
        const timeout = setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 200)
        return () => clearTimeout(timeout)
      }
    }
  }, [localPrice, priceTiers])

  return (
    <div className="px-5 pt-4 pb-3 space-y-4">
      <div className="text-center">
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block">
          Choisir le prix
        </label>
        <p className="font-figtree text-white/40 text-[12px] mt-0.5">
          Plus le prix est élevé, plus vous avez de chances d'obtenir le numéro
        </p>
      </div>

      {/* MODIFICATION : Changement mineur de hauteur (216px soit 4.5 items) pour un centrage parfait de l'item actif */}
      <div className="relative h-[216px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-12 -translate-y-1/2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0B0B0B] to-transparent z-20" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0B] to-transparent z-20" />
        <div
          ref={scrollContainerRef}
          onScroll={handleWheelScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[84px]"
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          {priceTiers.map((tier, i) => {
            // AJOUT : Calcul de l'index de scroll réel (flottant) pour une transition 3D ultra-fluide
            const currentScrollIndex = scrollTop / itemHeight
            const distanceFromCenter = i - currentScrollIndex

            // FORMULE APPLE : Rotation, échelle et opacité progressives selon la distance
            const rotateX = distanceFromCenter * -24 // Inclinaison cylindrique
            const scale = Math.max(0.85, 1.1 - Math.abs(distanceFromCenter) * 0.08)
            const opacity = Math.max(0.2, 1 - Math.abs(distanceFromCenter) * 0.35)
            const selected = localPrice === tier.price

            return (
              <button
                key={i}
                onClick={() => setLocalPrice(tier.price)}
                className="snap-center h-12 w-full flex flex-col items-center justify-center cursor-pointer select-none"
                style={{
                  transform: `rotateX(${rotateX}deg) scale(${scale})`,
                  opacity: opacity,
                  transformOrigin: 'center center -40px', // Crée la profondeur du tambour vers l'arrière
                  backfaceVisibility: 'hidden',
                  transition: isProgrammaticScroll.current ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none'
                }}
              >
                <span className={`font-figtree text-[18px] font-semibold ${selected ? 'text-white' : 'text-white/40'}`}>
                  ${formatPrice(tier.price)}
                </span>
                <span className={`text-[11px] ${selected ? 'text-white/50' : 'text-white/20'}`}>
                  {tier.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider text-center block">
          Votre prix max
        </label>
        <div className="flex items-center justify-center gap-3 bg-white/5 rounded-[14px] px-4 py-2 mt-2">
          {/* Strictement ton code logique d'origine */}
          <button
            onClick={() => setLocalPrice(Math.max(0.01, Math.round((localPrice - 1) * 100) / 100))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            −
          </button>
          
          {/* Strictement ton input modifiable d'origine */}
          <input
            type="text"
            value={`$${localPrice.toFixed(4)}`}
            onChange={(e) => {
              const val = parseFloat(e.target.value.replace('$', ''))
              if (!isNaN(val) && val > 0) setLocalPrice(val)
            }}
            className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] text-center bg-transparent border-none outline-none w-[160px] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          
          {/* Strictement ton code logique d'origine */}
          <button
            onClick={() => setLocalPrice(Math.round((localPrice + 1) * 100) / 100)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            +
          </button>
        </div>
        
        <svg
          className="mx-auto w-[80%] h-[6px] mt-1"
          viewBox="0 0 200 6"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,3 Q10,0 20,3 T40,3 T60,3 T80,3 T100,3 T120,3 T140,3 T160,3 T180,3 T200,3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.25"
          />
        </svg>
        <button
          onClick={() => selectPrice(localPrice)}
          className="w-full mt-4 py-3 rounded-[14px] bg-[#F97316] font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] cursor-pointer hover:brightness-110 transition-all duration-200 anim-glow-pulse"
        >
          Confirmer le prix
        </button>
      </div>
    </div>
  )
}
