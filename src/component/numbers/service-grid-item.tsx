'use client'

import { memo, useCallback, useRef } from 'react'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './category-constants'
import { usePrefetchCountries } from '@/hooks/use-numbers'
import type { ServiceItem } from '@/type/service'

interface ServiceGridItemProps {
  service: ServiceItem
  onClick: () => void
}

export const ServiceGridItem = memo(function ServiceGridItem({
  service,
  onClick,
}: ServiceGridItemProps) {
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
      className='group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:bg-card active:scale-[0.97]'
    >
      <div
        className='flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden'
        style={{
          backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[service.category] || CATEGORY_COLORS.other} 10%, transparent)`,
        }}
      >
        <img
          src={service.icon ?? '/assets/services/ot.webp'}
          alt={service.name}
          className='h-6 w-6 object-contain'
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/services/ot.webp'
          }}
        />
      </div>
      <div className='text-center space-y-1'>
        <p className='text-[13px] font-semibold text-foreground tracking-tight'>{service.name}</p>
        <p className='text-[10px] text-muted-foreground'>
          {CATEGORY_LABELS[service.category] || service.category}
        </p>
        {service.hasPrices && (
          <span className='inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary'>
            {service.countryCount} pays
          </span>
        )}
      </div>
    </button>
  )
})
