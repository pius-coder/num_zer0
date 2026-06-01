'use client'

import { memo, useCallback, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS, HOT_SERVICES } from './category-constants'
import { usePrefetchCountries } from '@/hooks/use-numbers'
import type { ServiceItem } from '@/type/service'

interface ServiceListItemProps {
  service: ServiceItem
  onClick: () => void
}

export const ServiceListItem = memo(function ServiceListItem({
  service,
  onClick,
}: ServiceListItemProps) {
  const prefetch = usePrefetchCountries()
  const prefetchedRef = useRef(false)

  const handleInteract = useCallback(() => {
    if (!prefetchedRef.current) {
      prefetch(service.slug)
      prefetchedRef.current = true
    }
  }, [prefetch, service.slug])

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleInteract}
      onTouchStart={handleInteract}
      className='group flex w-full items-center gap-3.5 rounded-xl border border-border bg-card/50 px-4 py-3 text-left transition-colors active:bg-card hover:bg-card'
    >
      <div
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden'
        style={{
          backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[service.category] || CATEGORY_COLORS.other} 10%, transparent)`,
        }}
      >
        <img
          src={service.icon ?? '/assets/services/ot.webp'}
          alt={service.name}
          className='h-5 w-5 object-contain'
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/services/ot.webp'
          }}
        />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <p className='truncate text-sm font-semibold text-foreground tracking-tight'>
            {service.name}
          </p>
          {service.hasPrices && (
            <span className='inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary'>
              {service.countryCount} pays
            </span>
          )}
        </div>
        <p className='text-[11px] text-muted-foreground'>
          {CATEGORY_LABELS[service.category] || service.category}
        </p>
      </div>
      {HOT_SERVICES.includes(service.slug) && (
        <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'>
          Hot
        </span>
      )}
      <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
    </button>
  )
})
