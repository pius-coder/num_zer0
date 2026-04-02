'use client'

import { memo } from 'react'

const CountrySkeletonRow = memo(function CountrySkeletonRow() {
  return (
    <div className='flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 animate-pulse'>
      <div className='shrink-0 size-5' />
      <div className='size-6 rounded bg-muted shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='h-4 w-24 rounded bg-muted mb-1.5' />
        <div className='h-3 w-32 rounded bg-muted' />
      </div>
      <div className='shrink-0 text-right'>
        <div className='h-4 w-12 rounded bg-muted mb-1.5' />
        <div className='h-3 w-8 rounded bg-muted' />
      </div>
      <div className='h-7 w-14 rounded-lg bg-muted shrink-0' />
    </div>
  )
})

export const CountrySkeleton = memo(function CountrySkeleton() {
  return (
    <div className='flex flex-col gap-1'>
      {Array.from({ length: 6 }).map((_, i) => (
        <CountrySkeletonRow key={i} />
      ))}
    </div>
  )
})
