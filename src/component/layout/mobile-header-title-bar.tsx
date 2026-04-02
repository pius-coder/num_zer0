'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/common/css'
import { MobileHeaderMenu } from './mobile-header-menu'

interface MobileHeaderTitleBarProps {
  title: string
  locale: string
  isMenuOpen: boolean
  onToggleMenu: () => void
  onSignOut: () => void
}

export function MobileHeaderTitleBar({
  title,
  locale,
  isMenuOpen,
  onToggleMenu,
  onSignOut,
}: MobileHeaderTitleBarProps) {
  return (
    <div className='bg-background'>
      <div className='px-4 py-2.5'>
        <div className='overflow-hidden font-mono bg-transparent transition-all duration-300'>
          <button
            type='button'
            className='flex w-full items-center gap-3 px-4 py-3 transition-all active:bg-accent'
          >
            <span
              className='text-[14px] font-bold text-foreground tracking-tight uppercase opacity-90'
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {title}
            </span>
          </button>
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isMenuOpen
                ? 'grid-rows-[1fr] opacity-100 border-t border-border'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            )}
          >
            <div className='overflow-hidden'>
              <div className='p-1 grid grid-cols-1 gap-1'>
                <MobileHeaderMenu locale={locale} onSignOut={onSignOut} />
              </div>
            </div>
          </div>
        </div>
        <button
          type='button'
          onClick={onToggleMenu}
          className='relative flex w-full justify-center items-center gap-3 px-4 py-3 transition-all active:bg-accent'
        >
          <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent' />
          {isMenuOpen ? (
            <ChevronUp className='h-4 w-4 text-muted-foreground' />
          ) : (
            <ChevronDown className='h-4 w-4 text-muted-foreground' />
          )}
        </button>
      </div>
    </div>
  )
}
