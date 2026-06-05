'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { COUNTRIES } from '@/components/services/data'
import { getDefaultMarginXaf } from './utils'
import { FLAG_BASE, PAGE_SIZE, XAF_USD_RATE } from './constants'
import type { TopCountryResult } from '#/type/sms_activation'

interface CountryListPageProps {
  serviceId: string
  topCountries: TopCountryResult[]
}

export function CountryListPage({ serviceId, topCountries }: CountryListPageProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const q = search.toLowerCase()
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const enriched = useMemo(
    () =>
      topCountries
        .map((tc) => {
          const match = tc.iso ? COUNTRIES.find((c) => c.iso === tc.iso) : null
          const marginUsd = getDefaultMarginXaf(tc.retailPrice) / XAF_USD_RATE
          const hasIso = !!tc.iso
          return {
            ...tc,
            code: match?.code ?? (hasIso ? tc.iso!.toLowerCase() : ''),
            phonePrefix: match?.phonePrefix ?? '',
            name: match?.name ?? (hasIso ? tc.iso! : tc.countryText),
            displayPrice: Math.round((tc.retailPrice + marginUsd) * 100) / 100,
          }
        })
        .filter((item) => {
          if (!search) return true
          const nameMatch = item.name.toLowerCase().includes(q)
          const prefixMatch = item.phonePrefix.replace('+', '').includes(q.replace('+', ''))
          const isoMatch = item.iso?.toLowerCase().includes(q)
          return nameMatch || prefixMatch || isoMatch
        }),
    [topCountries, search, q],
  )

  const paginated = search ? enriched : enriched.slice(0, displayCount)
  const hasMore = !search && paginated.length < enriched.length

  const observerCb = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, enriched.length))
      }
    },
    [enriched.length],
  )

  useEffect(() => {
    if (search) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(observerCb, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [search, observerCb])

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [search])

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          &larr; Retour
        </button>
        <h1 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          {serviceId}
        </h1>
      </div>
      <input
        type="text"
        placeholder="Rechercher un pays…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none mb-4"
      />
      {paginated.length === 0 ? (
        <p className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">
          Aucun pays disponible pour ce service.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {paginated.map((item) => (
            <button
              key={item.country}
              onClick={() => navigate({ to: `/my-space/${serviceId}/${item.iso ?? item.countryText}` })}
              className="flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {item.code ? (
                  <img
                    src={`${FLAG_BASE}/20x15/${item.code}.png`}
                    width="20"
                    height="15"
                    alt=""
                    className="shrink-0 block"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-5 h-[15px] bg-[var(--sea-ink-mist)] rounded" />
                )}
                <div className="min-w-0">
                  <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 text-[13px] text-[var(--sea-ink-soft)] font-semibold uppercase tracking-wider mt-0.5">
                    {item.iso && <span>{item.iso}</span>}
                    {item.phonePrefix && <span>{item.phonePrefix}</span>}
                  </div>
                </div>
              </div>
              <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right shrink-0 ml-2">
                {item.displayPrice.toFixed(2)} USD
              </span>
            </button>
          ))}
          {hasMore && <div ref={sentinelRef} className="col-span-full h-4" />}
        </div>
      )}
    </div>
  )
}
