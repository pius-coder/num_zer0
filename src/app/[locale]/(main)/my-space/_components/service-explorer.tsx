'use client'

import { useGlobalQueryParams } from '@/hooks/use-global-query-params'
import {
    Search,
    LayoutGrid,
    List,
    ChevronRight,
    MessageCircle,
    Send,
    Camera,
    Mail,
    Phone,
    Shield,
    Music,
    ShoppingBag,
    Gamepad2,
    Video,
} from 'lucide-react'
import { useMemo } from 'react'

interface Service {
    id: string
    name: string
    icon: React.ReactNode
    color: string
}

const SERVICES: Service[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="h-5 w-5" />, color: '#25D366' },
    { id: 'telegram', name: 'Telegram', icon: <Send className="h-5 w-5" />, color: '#26A5E4' },
    { id: 'instagram', name: 'Instagram', icon: <Camera className="h-5 w-5" />, color: '#E4405F' },
    { id: 'gmail', name: 'Google / Gmail', icon: <Mail className="h-5 w-5" />, color: '#EA4335' },
    { id: 'signal', name: 'Signal', icon: <Shield className="h-5 w-5" />, color: '#3A76F0' },
    { id: 'tiktok', name: 'TikTok', icon: <Music className="h-5 w-5" />, color: '#FF0050' },
    { id: 'amazon', name: 'Amazon', icon: <ShoppingBag className="h-5 w-5" />, color: '#FF9900' },
    { id: 'discord', name: 'Discord', icon: <Gamepad2 className="h-5 w-5" />, color: '#5865F2' },
    { id: 'viber', name: 'Viber', icon: <Phone className="h-5 w-5" />, color: '#7360F2' },
    { id: 'zoom', name: 'Zoom', icon: <Video className="h-5 w-5" />, color: '#2D8CFF' },
]

export function ServiceExplorer() {
    const { searchParams, setSearchParams } = useGlobalQueryParams()

    const query = searchParams.q ?? ''
    const view = (searchParams.display as 'list' | 'grid') || 'list'

    const filtered = useMemo(() => {
        if (!query.trim()) return SERVICES
        const q = query.toLowerCase()
        return SERVICES.filter((s) => s.name.toLowerCase().includes(q))
    }, [query])

    return (
        <div>
            {/* ── Sticky Search + View Toggle ── */}
            <div className="sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setSearchParams({ q: e.target.value || null })}
                            placeholder="Search services…"
                            className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none ring-0 transition-colors focus:border-[#adfa1b]/40 focus:bg-white/[0.05]"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        />
                    </div>

                    <div className="flex h-10 items-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                        <button
                            onClick={() => setSearchParams({ display: 'list' })}
                            className={`flex font-thin font-sans h-8 w-8 items-center justify-center rounded-lg transition-colors ${view === 'list'
                                ? 'bg-[#adfa1b] text-black/80'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            aria-label="List view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setSearchParams({ display: 'grid' })}
                            className={`flex font-thin font-sans h-8 w-8 items-center justify-center rounded-lg transition-colors ${view === 'grid'
                                ? 'bg-[#adfa1b] text-black/80'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Count ── */}
            <p className="mt-3 px-1 text-[12px] font-medium uppercase tracking-wider text-zinc-600">
                {filtered.length} service{filtered.length !== 1 && 's'}
            </p>

            {/* ── List View ── */}
            {view === 'list' && (
                <div className="grid grid-row-2 mt-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    {filtered.length === 0 && (
                        <div className="px-4 py-10 text-center text-sm text-zinc-600">
                            No services found.
                        </div>
                    )}
                    {filtered.map((service, i) => (
                        <button
                            key={service.id}
                            className={`group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:bg-white/[0.04] hover:bg-white/[0.03] ${i !== filtered.length - 1
                                ? 'border-b border-white/[0.04]'
                                : ''
                                }`}
                        >
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${service.color}18` }}
                            >
                                <div style={{ color: service.color }}>{service.icon}</div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold text-zinc-100 tracking-tight">
                                    {service.name}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    ))}
                </div>
            )}

            {/* ── Grid / Card View ── */}
            {view === 'grid' && (
                <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {filtered.length === 0 && (
                        <div className="col-span-full px-4 py-10 text-center text-sm text-zinc-600">
                            No services found.
                        </div>
                    )}
                    {filtered.map((service) => (
                        <button
                            key={service.id}
                            className="group flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04] active:scale-[0.97]"
                        >
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: `${service.color}18` }}
                            >
                                <div style={{ color: service.color }}>{service.icon}</div>
                            </div>
                            <div className="text-center">
                                <p className="text-[13px] font-semibold text-zinc-100 tracking-tight">
                                    {service.name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}