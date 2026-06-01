const s = { width: 16, height: 16, viewBox: "0 0 24 24" }
const p = "currentColor"

export function WorkIcon() {
  return (
    <svg {...s} fill="none" stroke={p} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}

export function PersonalIcon() {
  return (
    <svg {...s} fill="none" stroke={p} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ShoppingIcon() {
  return (
    <svg {...s} fill="none" stroke={p} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export function HealthIcon() {
  return (
    <svg {...s} fill="none" stroke={p} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
    </svg>
  )
}

export function FinanceIcon() {
  return (
    <svg {...s} fill="none" stroke={p} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export const categoryConfig: Record<string, { icon: typeof WorkIcon; label: string; color: string; dot: string }> = {
  work: { icon: WorkIcon, label: 'Work', color: 'text-blue-400', dot: 'bg-blue-400' },
  personal: { icon: PersonalIcon, label: 'Personal', color: 'text-purple-400', dot: 'bg-purple-400' },
  shopping: { icon: ShoppingIcon, label: 'Shopping', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  health: { icon: HealthIcon, label: 'Health', color: 'text-rose-400', dot: 'bg-rose-400' },
  finance: { icon: FinanceIcon, label: 'Finance', color: 'text-amber-400', dot: 'bg-amber-400' },
}

export const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  p1: { label: 'P1', color: 'text-red-400', dot: 'bg-red-400' },
  p2: { label: 'P2', color: 'text-orange-400', dot: 'bg-orange-400' },
  p3: { label: 'P3', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  p4: { label: 'P4', color: 'text-green-400', dot: 'bg-green-400' },
}
