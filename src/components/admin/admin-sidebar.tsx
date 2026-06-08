import { Link } from '@tanstack/react-router'

const NAV_ITEMS = [
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'users', label: 'Utilisateurs', icon: '👥' },
  { id: 'purchases', label: 'Achats', icon: '💳' },
  { id: 'activations', label: 'Activations', icon: '📱' },
  { id: 'wallets', label: 'Portefeuilles', icon: '👛' },
  { id: 'payment-intents', label: 'Paiements', icon: '💳' },
  { id: 'orders', label: 'Commandes', icon: '📋' },
  { id: 'ledger', label: 'Grand Livre', icon: '📒' },
  { id: 'accounting', label: 'Comptabilité', icon: '💰' },
  { id: 'promo-codes', label: 'Codes Promo', icon: '🎫' },
  { id: 'margins', label: 'Marges SMS', icon: '📈' },
  { id: 'packages', label: 'Packages', icon: '📦' },
] as const

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-[var(--line)]/50 bg-[var(--surface)] backdrop-blur-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <span className="font-kubo font-bold text-[#25D366] text-xl">N0</span>
        <span className="font-figtree text-[13px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
          Admin
        </span>
      </div>
      <div className="h-px bg-[var(--line)]/40 mb-3" />
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer font-figtree text-[15px] font-medium tracking-[-0.01em] ${
              activeTab === item.id
                ? 'bg-[#25D366]/10 text-[#25D366] font-semibold'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--line)]/10'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4">
        <div className="h-px bg-[var(--line)]/40 mb-3" />
        <Link
          to="/my-space"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer font-figtree text-[15px] font-medium tracking-[-0.01em] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--line)]/10 no-underline"
        >
          <span>←</span>
          <span>Retour App</span>
        </Link>
      </div>
    </aside>
  )
}
