'use client'

import { useNavigate } from '@tanstack/react-router'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import { useBottomNav } from '#/components/layout/bottom-nav-store'
import { PurchasePanel } from './purchase-panel'

interface PurchasePageProps {
  serviceId: string
  countryIso: string
}

export function PurchasePage({ serviceId, countryIso }: PurchasePageProps) {
  const navigate = useNavigate()
  const { openPanel } = useBottomNav()
  const service = SERVICES.find((s) => s.id === serviceId)
  const country = COUNTRIES.find((c) => c.iso === countryIso)
  if (!service || !country) return null

  return (
    <div className="mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12">
      <button
        onClick={() => navigate({ to: '/my-space/$serviceId', params: { serviceId } })}
        className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer"
      >
        &larr; Pays
      </button>
      <PurchasePanel
        service={service}
        country={country}
        onActivate={(activationId) => navigate({ to: `/my-space/activations/${activationId}` })}
        onRecharge={() => openPanel('recharge')}
      />
    </div>
  )
}
