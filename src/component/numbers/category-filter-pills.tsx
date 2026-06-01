'use client'

import { memo } from 'react'
import { Sparkles } from 'lucide-react'
import { CATEGORIES, CATEGORY_LABELS, type FilterMode } from './category-constants'

interface CategoryFilterPillsProps {
  filterMode: FilterMode
  selectedCategory: string
  onFilterModeChange: (mode: FilterMode) => void
  onCategoryChange: (category: string) => void
}

export const CategoryFilterPills = memo(function CategoryFilterPills({
  filterMode,
  selectedCategory,
  onFilterModeChange,
  onCategoryChange,
}: CategoryFilterPillsProps) {
  return (
    <div className='flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-1'>
      <button
        onClick={() => {
          onFilterModeChange('all')
          onCategoryChange('all')
        }}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          filterMode === 'all' && selectedCategory === 'all'
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground hover:text-foreground border border-transparent'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onFilterModeChange('popular')}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          filterMode === 'popular'
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground hover:text-foreground border border-transparent'
        }`}
      >
        <Sparkles className='h-3.5 w-3.5' />
        Popular
      </button>
      <div className='w-px h-4 bg-border mx-1 shrink-0' />
      {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
        <button
          key={cat}
          onClick={() => {
            onCategoryChange(cat)
            onFilterModeChange('all')
          }}
          className={`shrink-0 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedCategory === cat
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          {CATEGORY_LABELS[cat] || cat}
        </button>
      ))}
    </div>
  )
})
