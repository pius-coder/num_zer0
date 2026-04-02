'use client'

import { cn } from '@/common/css'
import { Globe, Smartphone } from 'lucide-react'
import { ClientOnly } from '@/component/ui/client-only'
import { MySpaceOrchestrator } from '@/component/numbers/my-space-orchestrator'
import { useGlobalQueryParams } from '@/hooks/use-global-query-params'
import type { ServiceItem } from '@/type/service'

interface MySpaceTabsProps {
  initialServices: ServiceItem[]
}

export function MySpaceTabs({ initialServices }: MySpaceTabsProps) {
  const { params, setTab } = useGlobalQueryParams()

  return (
    <>
      <div className='sticky top-0 z-40 bg-background/80 backdrop-blur-xl -mx-3 md:-mx-6 px-3 md:px-6 py-2'>
        <div className='flex gap-1 bg-muted rounded-xl p-1'>
          <button
            onClick={() => setTab('services')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
              params.tab === 'services'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className='size-4' />
            Services
          </button>
          <button
            onClick={() => setTab('numbers')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
              params.tab === 'numbers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Smartphone className='size-4' />
            Mes Numéros
          </button>
        </div>
      </div>

      <div className='mt-4'>
        <ClientOnly>
          <MySpaceOrchestrator initialServices={initialServices} tab={params.tab} />
        </ClientOnly>
      </div>
    </>
  )
}
