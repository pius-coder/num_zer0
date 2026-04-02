'use client'

import { memo } from 'react'
import { X } from 'lucide-react'

interface CountryDrawerHeaderProps {
  icon: string
  name: string
  totalCountries: number
  onClose: () => void
}

export const CountryDrawerHeader = memo(function CountryDrawerHeader({
  icon,
  name,
  totalCountries,
  onClose,
}: CountryDrawerHeaderProps) {
  return (
    <div className='shrink-0 flex items-center justify-between px-4 py-3 border-b'>
      <div className='flex items-center gap-3'>
        <img
          src={icon}
          alt={name}
          className='size-8 rounded-lg object-contain bg-muted'
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/services/ot.webp'
          }}
        />
        <div>
          <h3 className='font-semibold text-sm'>{name}</h3>
          <p className='text-xs text-muted-foreground'>{totalCountries} countries available</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className='size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all touch-manipulation'
      >
        <X className='size-4' />
      </button>
    </div>
  )
})
