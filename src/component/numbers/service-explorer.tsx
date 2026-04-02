'use client'

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { ServiceSearchBar } from './service-search-bar'
import { CategoryFilterPills } from './category-filter-pills'
import { ServiceListItem } from './service-list-item'
import { ServiceGridItem } from './service-grid-item'
import { ServiceSkeleton } from './service-skeleton'
import { HOT_SERVICES, type FilterMode } from './category-constants'
import { useInfiniteServices } from '@/hooks/use-numbers'
import type { ServiceItem } from '@/type/service'

interface ServiceExplorerProps {
  initialData?: ServiceItem[]
  onServiceSelect?: (service: ServiceItem) => void
}

export function ServiceExplorer({ initialData = [], onServiceSelect }: ServiceExplorerProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const services = useInfiniteServices({
    q: debouncedQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  })

  const apiTotal = services.data?.pages?.[0]?.total ?? 0

  const allServices = useMemo(() => {
    const fetched = services.data?.pages.flatMap((p) => p.items) ?? []
    const merged = [...initialData]
    const fetchedSlugs = new Set(merged.map((s) => s.slug))
    for (const s of fetched) {
      if (!fetchedSlugs.has(s.slug)) merged.push(s)
    }
    return merged
  }, [initialData, services.data?.pages])

  const filtered = useMemo(() => {
    let result = allServices
    if (filterMode === 'popular') {
      result = result.filter((s) => HOT_SERVICES.includes(s.slug))
    }
    return result
  }, [allServices, filterMode])

  const handleQueryChange = useCallback((value: string | null) => {
    setQuery(value ?? '')
  }, [])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (services.isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && services.hasNextPage) {
            services.fetchNextPage()
          }
        },
        { rootMargin: '400px' }
      )
      if (node) observerRef.current.observe(node)
    },
    [services.isFetchingNextPage, services.hasNextPage, services.fetchNextPage]
  )

  const isLoading = services.isLoading && allServices.length === 0
  const total = apiTotal || allServices.length

  return (
    <div className='flex flex-col'>
      <div className='shrink-0 sticky top-12 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-background/80 backdrop-blur-xl border-b border-border'>
        <ServiceSearchBar
          query={query}
          view={view}
          onQueryChange={handleQueryChange}
          onViewChange={setView}
        />
        <CategoryFilterPills
          filterMode={filterMode}
          selectedCategory={selectedCategory}
          onFilterModeChange={setFilterMode}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <p className='mt-3 px-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground'>
        {isLoading ? '...' : `${filtered.length} / ${total} services`}
      </p>

      <div className='mt-2 lg:max-h-[calc(100vh-350px)] overflow-y-auto'>
        {view === 'list' && (
          <div className='mt-3 flex flex-col gap-1.5'>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => <ServiceSkeleton key={i} view='list' />)}
            {!isLoading && filtered.length === 0 && (
              <div className='px-4 py-10 text-center text-sm text-muted-foreground'>
                No services found.
              </div>
            )}
            {filtered.map((service) => (
              <ServiceListItem
                key={service.slug}
                service={service}
                onClick={() => onServiceSelect?.(service)}
              />
            ))}
            {services.isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, i) => <ServiceSkeleton key={i} view='list' />)}
            {services.hasNextPage && <div ref={loadMoreRef} className='h-1' />}
          </div>
        )}

        {view === 'grid' && (
          <div className='mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => <ServiceSkeleton key={i} view='grid' />)}
            {!isLoading && filtered.length === 0 && (
              <div className='col-span-full px-4 py-10 text-center text-sm text-muted-foreground'>
                No services found.
              </div>
            )}
            {filtered.map((service) => (
              <ServiceGridItem
                key={service.slug}
                service={service}
                onClick={() => onServiceSelect?.(service)}
              />
            ))}
            {services.isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, i) => <ServiceSkeleton key={i} view='grid' />)}
            {services.hasNextPage && <div ref={loadMoreRef} className='col-span-full h-1' />}
          </div>
        )}
      </div>
    </div>
  )
}
