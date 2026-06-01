'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MySpaceTabs } from '@/component/numbers/my-space-tabs'
import { DesktopSidebar } from '@/component/numbers/desktop-sidebar'
import { MySpaceHeroMobile } from '@/component/spa/my-space-hero-mobile'
import { MySpaceHeroDesktop } from '@/component/spa/my-space-hero-desktop'
import type { ServiceItem } from '@/type/service'

function useServices(initial: ServiceItem[]) {
  return useQuery<ServiceItem[]>({
    queryKey: ['spa-services'],
    queryFn: async () => {
      const res = await fetch('/api/client/services')
      if (!res.ok) return initial
      const data = await res.json()
      return data.services ?? data ?? initial
    },
    initialData: initial,
    staleTime: 60_000,
  })
}

export function MySpacePage() {
  const initialServices: ServiceItem[] = []
  const { data: services } = useServices(initialServices)

  return (
    <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
      <MySpaceHeroMobile />
      <MySpaceHeroDesktop />
      <div className='lg:grid lg:grid-cols-[1fr_320px] lg:gap-6'>
        <section>
          <Suspense
            fallback={<div className='py-20 text-center text-muted-foreground'>Loading...</div>}
          >
            <MySpaceTabs initialServices={services} />
          </Suspense>
        </section>
        <aside className='hidden lg:block'>
          <DesktopSidebar />
        </aside>
      </div>
    </div>
  )
}
