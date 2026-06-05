'use client'

import { useNavigate } from '@tanstack/react-router'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import { PurchasePanel } from './purchase-panel'

interface PurchasePageProps {
  serviceId: string
  countryIso: string
  balanceUsd: number
}

export function PurchasePage({ serviceId, countryIso, balanceUsd }: PurchasePageProps) {
  const navigate = useNavigate()
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
        balanceUsd={balanceUsd}
        onActivate={(activationId) => navigate({ to: `/my-space/activations/${activationId}` })}
        onRecharge={() => navigate({ to: '/recharge' })}
      />
    </div>
  )
}
