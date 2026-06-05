'use client'

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import { ServiceIcon } from './service-icon'
import { ServiceBadge } from './service-badge'
import type { SmsActivation } from '#/type/sms_activation'
import { isActiveStatus } from './utils'
import { STATUS_LABELS, STATUS_COLORS, FLAG_BASE } from './constants'

interface ServiceListPageProps {
  myActivations: SmsActivation[]
  balanceUsd: number
}

export function ServiceListPage({ myActivations }: ServiceListPageProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const activeActivations = myActivations.filter((a) => isActiveStatus(a.status))
  const filtered = search
    ? SERVICES.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : SERVICES

  return (
    <div className="mx-auto max-w-7xl w-full h-dvh overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 pt-4 md:px-6 md:pt-8">
        <input
          type="text"
          placeholder="Rechercher un service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full font-figtree text-[var(--sea-ink-soft)] text-[18px] font-medium tracking-[-0.04em] outline-none placeholder:text-[var(--sea-ink-soft)]/50 mb-4"
        />
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-figtree text-[var(--sea-ink-soft)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            Choisissez un service
          </h1>
          <button
            onClick={() => navigate({ to: '/my-space/history' })}
            className="relative inline-flex flex-col items-center cursor-pointer group"
          >
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider">
              Historique
            </span>
            <svg
              className="w-full h-[4px]"
              viewBox="0 0 80 4"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0,2 Q10,0 20,2 T40,2 T60,2 T80,2"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.35"
                className="text-[var(--sea-ink-soft)]"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 md:px-6 md:pb-8">
        {activeActivations.length > 0 && (
          <div className="mb-8 space-y-2">
            <h2 className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-3">
              Activations en cours ({activeActivations.length})
            </h2>
            {activeActivations.map((act) => {
              const countryInfo = COUNTRIES.find((c) => c.iso === act.country)
              return (
                <button
                  key={act._id}
                  onClick={() => navigate({ to: `/my-space/activations/${act._id}` })}
                  className="w-full flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceBadge service={act.service} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {countryInfo?.code ? (
                          <img
                            src={`${FLAG_BASE}/20x15/${countryInfo.code}.png`}
                            width="20"
                            height="15"
                            alt=""
                            className="shrink-0 block"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="truncate">{act.phoneNumber ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--sea-ink-soft)] text-[13px] font-semibold tracking-wider truncate">
                          {countryInfo?.name ?? act.country}
                        </span>
                        <span
                          className={`text-[13px] font-semibold uppercase tracking-wider shrink-0 ${STATUS_COLORS[act.status]}`}
                        >
                          {STATUS_LABELS[act.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider shrink-0 ml-2">
                    &rarr;
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate({ to: `/my-space/${s.id}` })}
              className="flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ServiceIcon serviceId={s.id} name={s.name} />
                <div>
                  <span>{s.name}</span>
                  <span className="text-[var(--sea-ink-soft)] text-[12px] font-light ml-2">
                    {s.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
