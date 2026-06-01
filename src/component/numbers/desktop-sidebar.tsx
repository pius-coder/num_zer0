'use client'

import { Zap, ArrowRight, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const QUICK_SERVICES = [
  { name: 'WhatsApp', country: 'France', color: '#25D366' },
  { name: 'Telegram', country: 'UK', color: '#26A5E4' },
  { name: 'Google', country: 'US', color: '#EA4335' },
  { name: 'Instagram', country: 'Germany', color: '#E4405F' },
]

export function DesktopSidebar() {
  return (
    <div className='space-y-6'>
      {/* ── Quick Actions ── */}
      <div className='rounded-2xl border border-border bg-card p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <Zap className='h-4 w-4 text-primary' />
          <h3 className='text-sm font-semibold text-foreground'>Quick Actions</h3>
        </div>
        <div className='space-y-2'>
          <Link
            href='wallet'
            className='flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            <span>Recharge Credits</span>
            <ArrowRight className='h-4 w-4 text-muted-foreground' />
          </Link>
          <Link
            href='/my-space?tab=numbers'
            className='flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            <span>View Active Numbers</span>
            <ArrowRight className='h-4 w-4 text-muted-foreground' />
          </Link>
          <Link
            href='account'
            className='flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            <span>Account Settings</span>
            <ArrowRight className='h-4 w-4 text-muted-foreground' />
          </Link>
        </div>
      </div>

      {/* ── Popular Services ── */}
      <div className='rounded-2xl border border-border bg-card p-5'>
        <div className='flex items-center gap-2 mb-4'>
          <Star className='h-4 w-4 text-yellow-500' />
          <h3 className='text-sm font-semibold text-foreground'>Popular Services</h3>
        </div>
        <div className='space-y-2'>
          {QUICK_SERVICES.map((service) => (
            <button
              key={`${service.name}-${service.country}`}
              className='flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent group'
            >
              <div className='flex items-center gap-3'>
                <div
                  className='flex h-8 w-8 items-center justify-center rounded-lg'
                  style={{ backgroundColor: `${service.color}18` }}
                >
                  <div
                    className='h-3 w-3 rounded-full'
                    style={{ backgroundColor: service.color }}
                  />
                </div>
                <div>
                  <p className='text-sm font-medium text-foreground'>{service.name}</p>
                  <p className='text-xs text-muted-foreground'>{service.country}</p>
                </div>
              </div>
              <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
