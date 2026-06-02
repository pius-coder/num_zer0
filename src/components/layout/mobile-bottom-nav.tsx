'use client'

import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { MenuIcon } from '@/components/landing/menu-icons'
// import { TbMoneybagPlus } from 'react-icons/tb' // TODO: install bun add react-icons

const NAV_ITEMS = [
  { path: '/my-space', label: 'Mon Espace' },
  { path: '/wallet', label: 'Portefeuille' },
  { path: '/account', label: 'Compte' },
  { path: '/recharge', label: 'Recharger' },
  { path: '/support', label: 'Support' },
] as const

export function MobileBottomNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const balance = 0

  return (
    <>
      <div className="fixed p-1 left-3 text-center bottom-3 z-50 md:hidden flex flex-col items-center">
        {NAV_ITEMS.map(({ path, label }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')

          return isActive ? (
            <h3
              className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-[#25D366]"
            >
              {label}
            </h3>
          ) : null
        })}
      </div>
      <div className="fixed right-3 bottom-3 z-50 md:hidden flex flex-col items-end">
        <div
          className="relative inline-flex w-fit max-w-[92vw] overflow-hidden rounded-[18px] transition-all duration-500 ease-out"
          style={{
            maxHeight: isOpen ? '560px' : '52px',
          }}
        >
          <div
            className="absolute inset-0 rounded-[18px] bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 ring-1 ring-[var(--line)]/30"
            style={{
              boxShadow:
                '0 26px 75px rgba(0,0,0,0.42), 0 10px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.03), inset 0 1px 0 var(--inset-glint), inset 1px 0 0 rgba(255,255,255,0.015), inset -1px 0 0 rgba(0,0,0,0.22), inset 0 -1px 0 rgba(0,0,0,0.24)',
            }}
          />
          <div className="relative flex flex-col-reverse">
            {/* Compact bar: [+      0000] | XAF [HAMBURGER] */}
            <div className="flex items-center justify-between px-3 py-[10px]">
              <div className="flex items-center justify-between flex-1 mr-3 min-w-0">
                <span className="text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight">
                  {balance.toLocaleString('fr-FR')}
                </span>
                <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-3 shrink-0">
                  XAF
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="h-4 w-px bg-[var(--line)]/40" />
                <span className="text-xl leading-none font-bold flex items-center justify-center w-[28px] h-[28px] text-[var(--sea-ink)]">
                  {/* <TbMoneybagPlus /> */}+
                </span>

                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="h-[30px] w-[30px] p-0 bg-transparent border-none cursor-pointer shrink-0 text-[var(--sea-ink)]"
                  aria-label={isOpen ? 'Close menu' : 'Open menu'}
                >
                  <MenuIcon />
                </button>
              </div>
            </div>

            {/* Open panel: expands upward from bottom bar */}
            <div
              className="transition-all duration-500 ease-out"
              style={{
                maxHeight: isOpen ? '500px' : '0px',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              <div className="flex flex-col gap-[18px] px-5 pt-4 pb-3">
                <div className="flex flex-col w-full gap-2">
                  {NAV_ITEMS.map(({ path, label }) => {
                    const isActive =
                      pathname === path || pathname.startsWith(path + '/')
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setIsOpen(false)}
                        className="block bg-transparent w-full no-underline"
                      >
                        <h3
                          className={`font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 ${
                            isActive
                              ? 'text-[#25D366]'
                              : 'text-[var(--sea-ink)]'
                          }`}
                        >
                          {label}
                        </h3>
                      </Link>
                    )
                  })}
                </div>

                <div className="border-t border-[var(--line)]/40 pt-3 pb-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
