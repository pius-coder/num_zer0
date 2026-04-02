'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CountryDrawerHeader } from './country-drawer-header'
import { CountrySearchInput } from './country-search-input'
import { CountryListItem } from './country-list-item'
import { CountrySkeleton } from './country-skeleton'
import { getCountryByIso } from '@/common/catalog'
import type { CountryItem, ServiceItem, SubProviderDetail } from '@/type/service'

type MinimalService = Pick<ServiceItem, 'slug' | 'name'> & { icon: string }

interface CountryDrawerProps {
  service: MinimalService
  countries: CountryItem[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage?: () => void
  onClose: () => void
  onCountryBuy: (country: CountryItem) => void
  onSubProviderBuy: (country: CountryItem, subProvider: SubProviderDetail) => void
  open: boolean
}

export function CountryDrawer({
  service,
  countries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onClose,
  onCountryBuy,
  onSubProviderBuy,
  open,
}: CountryDrawerProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) {
      setSearch('')
      setExpanded(new Set())
    }
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  const toggleExpand = useCallback((countryIso: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(countryIso)) next.delete(countryIso)
      else next.add(countryIso)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    if (!search) return countries
    const q = search.toLowerCase()
    return countries.filter((c) => {
      const countryMeta = getCountryByIso(c.countryIso)
      const name = countryMeta?.name ?? c.countryIso
      return c.countryIso.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    })
  }, [countries, search])

  const onFetchNextPageRef = useRef(onFetchNextPage)
  useEffect(() => {
    onFetchNextPageRef.current = onFetchNextPage
  }, [onFetchNextPage])

  const hasNextPageRef = useRef(hasNextPage)
  useEffect(() => {
    hasNextPageRef.current = hasNextPage
  }, [hasNextPage])

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node || !hasNextPageRef.current) return
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPageRef.current) {
        onFetchNextPageRef.current?.()
      }
    })
    observerRef.current.observe(node)
  }, [])

  const observerRef = useRef<IntersectionObserver | null>(null)

  const hasCachedData = countries.length > 0
  const showSkeleton = isLoading && !hasCachedData

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-150 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[60] h-[75vh] rounded-t-2xl border-t bg-background shadow-xl flex flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-150 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!open}
      >
        <CountryDrawerHeader
          icon={service.icon}
          name={service.name}
          totalCountries={hasCachedData ? countries.length : 0}
          onClose={onClose}
        />
        <CountrySearchInput value={search} onChange={setSearch} />
        <div className='flex-1 overflow-y-auto px-4 pb-8'>
          {showSkeleton ? (
            <div className='flex flex-col gap-1.5 mt-1'>
              <CountrySkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className='py-16 text-center text-sm text-muted-foreground'>
              {isLoading ? (
                <Loader2 className='size-5 animate-spin mx-auto mb-2 text-muted-foreground' />
              ) : null}
              No countries found.
            </div>
          ) : (
            <div className='flex flex-col gap-1'>
              {filtered.map((country) => (
                <CountryListItem
                  key={country.countryIso}
                  country={country}
                  countryName={getCountryByIso(country.countryIso)?.name ?? country.countryIso}
                  countryIcon={`/assets/countries/${country.countryIso}.webp`}
                  isExpanded={expanded.has(country.countryIso)}
                  onToggleExpand={() => toggleExpand(country.countryIso)}
                  onBuy={() => onCountryBuy(country)}
                  onSubProviderBuy={(sub) => onSubProviderBuy(country, sub)}
                />
              ))}
              {hasNextPage && (
                <div ref={loadMoreRef} className='flex items-center justify-center py-4'>
                  {isFetchingNextPage && (
                    <Loader2 className='size-5 animate-spin text-muted-foreground' />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
