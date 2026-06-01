'use client'

import { memo } from 'react'

interface CountrySearchInputProps {
  value: string
  onChange: (value: string) => void
}

export const CountrySearchInput = memo(function CountrySearchInput({
  value,
  onChange,
}: CountrySearchInputProps) {
  return (
    <div className='shrink-0 px-4 py-2'>
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Search country...'
        className='h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary/40'
      />
    </div>
  )
})
