'use client'

import { Bell, ChevronDown, Menu, UserCircle, Volume2, Wallet, LifeBuoy, LogOut, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { signOut } from '@/lib/auth/auth-client'
import { cn } from '@/lib/utils'

const LogoMark = () => (
    <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold tracking-tight text-white"
        style={{ backgroundColor: '#2563eb' }}
        aria-hidden
    >
        N0
    </div>
)

export function MobileHeader({ locale }: MobileHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="flex flex-col border-b border-[rgba(255,255,255,0.06)] bg-[#080808] md:hidden sticky top-0 z-50">
            {/* Top Bar (Header Top) */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)] bg-[#080808]">
                <Link href={`/${locale}/my-space`} className="flex items-center gap-2.5">
                    <LogoMark />
                    <span
                        className="text-[15px] font-bold tracking-[-0.03em] text-zinc-100"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        NumZero
                    </span>
                </Link>
            </div>

            {/* Profile Bar / Dropdown Container */}
            <div className="bg-[#080808]">
                <div className="px-4 py-2.5">
                    <div className={cn(
                        "overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0f0f0f] shadow-md transition-all duration-300",
                        isMenuOpen ? "rounded-b-[24px]" : ""
                    )}>
                        {/* Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex w-full items-center gap-3 px-4 py-3 transition-all active:bg-[#151515]"
                        >
                            <UserCircle className="h-6 w-6 text-zinc-500" />
                            <span className="text-[14px] font-bold text-[#fafafa] tracking-tight uppercase opacity-90" style={{ fontFamily: 'var(--font-inter)' }}>
                                Profile
                            </span>
                            <span className="ml-auto text-[14px] font-bold text-[#fafafa] tabular-nums tracking-tight">
                                $ 0
                            </span>
                            {isMenuOpen ? (
                                <ChevronUp className="h-4 w-4 text-zinc-600" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-zinc-600" />
                            )}
                        </button>

                        {/* Collapsible Content */}
                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isMenuOpen ? "grid-rows-[1fr] opacity-100 border-t border-[rgba(255,255,255,0.06)]" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                        )}>
                            <div className="overflow-hidden">
                                <div className="p-1 grid grid-cols-1 gap-1">
                                    <Link
                                        href={`/${locale}/recharge`}
                                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors"
                                    >
                                        <Wallet className="h-5 w-5 text-blue-500" />
                                        <span className="text-[14px] font-semibold">Recharge</span>
                                    </Link>

                                    <Link
                                        href={`/${locale}/support`}
                                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors"
                                    >
                                        <LifeBuoy className="h-5 w-5 text-emerald-500" />
                                        <span className="text-[14px] font-semibold">Support</span>
                                    </Link>

                                    <button
                                        onClick={() => signOut({
                                            fetchOptions: {
                                                onSuccess: () => {
                                                    window.location.href = `/${locale}/login`
                                                }
                                            }
                                        })}
                                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="text-[14px] font-semibold">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}