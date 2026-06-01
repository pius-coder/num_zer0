'use client'

import { memo } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'

interface ServiceSearchBarProps {
  query: string
  view: 'list' | 'grid'
  onQueryChange: (value: string | null) => void
  onViewChange: (view: 'list' | 'grid') => void
}

export const ServiceSearchBar = memo(function ServiceSearchBar({
  query,
  view,
  onQueryChange,
  onViewChange,
}: ServiceSearchBarProps) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative flex-1'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <input
          type='text'
          value={query}
          onChange={(e) => onQueryChange(e.target.value || null)}
          placeholder='Search services...'
          className='h-10 w-full rounded-xl border border-border bg-card/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-0 transition-colors focus:border-primary/40 focus:bg-card'
        />
      </div>
      <div className='flex h-10 items-center rounded-xl border border-border bg-card/50 p-1'>
        <button
          onClick={() => onViewChange('list')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            view === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label='List view'
        >
          <List className='h-4 w-4' />
        </button>
        <button
          onClick={() => onViewChange('grid')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            view === 'grid'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label='Grid view'
        >
          <LayoutGrid className='h-4 w-4' />
        </button>
      </div>
    </div>
  )
})
