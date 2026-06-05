'use client'

import { useNavigate } from '@tanstack/react-router'
import { COUNTRIES } from '@/components/services/data'
import { ServiceBadge } from './service-badge'
import type { SmsActivation } from '#/type/sms_activation'
import { STATUS_LABELS, STATUS_COLORS, FLAG_BASE } from './constants'

interface HistoryViewPageProps {
  myActivations: SmsActivation[]
}

export function HistoryViewPage({ myActivations }: HistoryViewPageProps) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-7xl w-full h-dvh overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 pt-4 md:px-6 md:pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
          >
            &larr; Retour
          </button>
          <h1 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            Historique
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 md:px-6 md:pb-8">
        {myActivations.length === 0 ? (
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[18px] font-medium tracking-[-0.04em]">
            Aucune activation passée.
          </p>
        ) : (
          <div className="space-y-2">
            {myActivations.map((act) => {
              const countryInfo = COUNTRIES.find((c) => c.iso === act.country)
              return (
                <button
                  key={act._id}
                  onClick={() => navigate({ to: `/my-space/activations/${act._id}` })}
                  className="w-full flex items-center justify-between font-figtree text-left text-gray-400 text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
                        <span className="text-gray-500 text-[13px] font-semibold tracking-wider truncate">
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
                  <span className="text-gray-500 text-[15px] font-semibold tracking-wider shrink-0 ml-2">
                    &rarr;
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
