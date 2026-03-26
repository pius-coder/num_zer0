'use client'

import { Bell, ChevronDown, Menu, UserCircle, Volume2 } from 'lucide-react'
import Link from 'next/link'

const LogoMark = () => (
    <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold tracking-tight text-white"
        style={{ backgroundColor: '#2563eb' }}
        aria-hidden
    >
        N0
    </div>
)

interface MobileHeaderProps {
    locale: string
}

export function MobileHeader({ locale }: MobileHeaderProps) {
    return (
        <header className="flex flex-col border-b border-[rgba(255,255,255,0.06)] bg-[#080808] md:hidden">
            {/* Top Bar (Header Top) */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)]">
                <Link href={`/${locale}/my-space`} className="flex items-center gap-2.5">
                    <LogoMark />
                    <span
                        className="text-[15px] font-bold tracking-[-0.03em] text-zinc-100"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        NumZero
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* Language toggle (Recreating from snippet) */}
                    <button className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 transition-colors hover:bg-white/[0.08]">
                        <span className="text-[12px] font-bold text-zinc-200">EN</span>
                        <ChevronDown className="h-3 w-3 text-zinc-500" />
                    </button>

                    <div className="flex items-center gap-1">
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/[0.04]">
                            <Bell className="h-5 w-5 text-[#2563eb]" />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/[0.04]">
                            <Volume2 className="h-5 w-5 text-[#2563eb]" />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/[0.04]">
                            <Menu className="h-5 w-5 text-zinc-100" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Bar (Mobile Bottom) */}
            <div className="px-4 py-2.5 bg-[#080808]">
                <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0f0f0f] px-4 py-3 shadow-md transition-all active:scale-[0.98] active:bg-[#151515]"
                >
                    <UserCircle className="h-6 w-6 text-zinc-500" />
                    <span className="text-[14px] font-bold text-[#fafafa] tracking-tight uppercase opacity-90" style={{ fontFamily: 'var(--font-inter)' }}>
                        Profile
                    </span>
                    <span className="ml-auto text-[14px] font-bold text-[#fafafa] tabular-nums tracking-tight">
                        $ 0
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-600" />
                </button>
            </div>
        </header>
    )
}