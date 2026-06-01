'use client'

import { memo, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { CountryFlag } from './country-flag'
import { SubProviderRow } from './sub-provider-row'
import type { CountryItem, SubProviderDetail } from '@/type/service'

interface CountryListItemProps {
  country: CountryItem
  countryName: string
  countryIcon: string
  isExpanded: boolean
  onToggleExpand: () => void
  onBuy: () => void
  onSubProviderBuy: (subProvider: SubProviderDetail) => void
}

export const CountryListItem = memo(function CountryListItem({
  country,
  countryName,
  countryIcon,
  isExpanded,
  onToggleExpand,
  onBuy,
  onSubProviderBuy,
}: CountryListItemProps) {
  const providerCount = country.providerCount ?? 0

  const handleSubBuy = useCallback(
    (sub: SubProviderDetail) => {
      onSubProviderBuy(sub)
    },
    [onSubProviderBuy]
  )

  return (
    <div>
      <div className='flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5'>
        {providerCount > 1 ? (
          <button
            onClick={onToggleExpand}
            className='shrink-0 p-0.5 text-muted-foreground hover:text-foreground active:scale-90 transition-all touch-manipulation'
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
          </button>
        ) : (
          <div className='shrink-0 size-5' />
        )}

        <CountryFlag src={countryIcon} alt={countryName} fallbackLetter={countryName} />

        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium truncate'>{countryName}</p>
          <p className='text-xs text-muted-foreground'>
            {country.availability.toLocaleString()} available
            {providerCount > 1 && <> &middot; {providerCount} providers</>}
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <div className='text-right'>
            <p className='text-sm font-bold'>{country.priceCredits} cr</p>
          </div>
          <button
            onClick={onBuy}
            disabled={!country.priceCredits}
            className='rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all touch-manipulation disabled:opacity-50'
          >
            Buy
          </button>
        </div>
      </div>

      {isExpanded && country.subProviders.length > 0 && (
        <div className='ml-8 mt-1 mb-2 flex flex-col gap-0.5'>
          {country.subProviders.map((sub, idx) => (
            <SubProviderRow
              key={sub.providerCode}
              subProvider={sub}
              index={idx}
              onBuy={() => handleSubBuy(sub)}
            />
          ))}
        </div>
      )}
    </div>
  )
})
