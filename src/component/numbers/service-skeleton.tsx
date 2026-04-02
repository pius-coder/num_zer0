'use client'

import { memo } from 'react'

export const ServiceSkeleton = memo(function ServiceSkeleton({ view }: { view: 'list' | 'grid' }) {
  if (view === 'grid') {
    return (
      <div className='flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card/50 p-4'>
        <div className='h-12 w-12 rounded-2xl bg-muted animate-pulse' />
        <div className='h-3 w-16 rounded bg-muted animate-pulse' />
        <div className='h-2 w-10 rounded bg-muted/60 animate-pulse' />
      </div>
    )
  }
  return (
    <div className='flex items-center gap-3.5 rounded-xl border border-border bg-card/50 px-4 py-3'>
      <div className='h-9 w-9 shrink-0 rounded-xl bg-muted animate-pulse' />
      <div className='flex-1 space-y-2'>
        <div className='h-3.5 w-32 rounded bg-muted animate-pulse' />
        <div className='h-2.5 w-20 rounded bg-muted/60 animate-pulse' />
      </div>
      <div className='h-4 w-4 shrink-0 rounded bg-muted/60 animate-pulse' />
    </div>
  )
})
