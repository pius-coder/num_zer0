'use client'

import { useState } from 'react'

interface RentalOption {
  label: string
  hours: number
  cost: number
}

interface RentalOptionsProps {
  rentalOptions: RentalOption[]
  selectedIndex: number
  onSelect: (idx: number) => void
}

export function RentalOptions({ rentalOptions, selectedIndex, onSelect }: RentalOptionsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect(0)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-[14px] font-figtree text-[15px] font-semibold cursor-pointer transition-all ${
          selectedIndex === 0
            ? 'bg-zinc-700/40 border border-zinc-500/60 text-white'
            : 'bg-white/5 border border-white/10 text-white/80 hover:border-white/30'
        } ${selectedIndex !== 0 ? 'opacity-80' : ''}`}
      >
        <span className={selectedIndex === 0 ? 'text-white' : 'text-white/65'}>20 minutes</span>
        <span className={selectedIndex === 0 ? 'text-zinc-200' : 'text-white/45'}>
          ${(rentalOptions[0]?.cost ?? 0).toFixed(2)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-[14px] border border-dashed border-white/10 font-figtree text-white/45 text-[15px] font-semibold cursor-pointer hover:border-white/30 hover:text-white/65 transition-all"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {expanded ? 'Masquer' : `${Math.max(rentalOptions.length - 1, 0)} autres durées`}
      </button>

      {expanded && rentalOptions.length > 1 && (
        <div className="grid grid-cols-2 gap-2 animate-fadeIn">
          {rentalOptions.slice(1).map((opt, i) => {
            const idx = i + 1
            const selected = selectedIndex === idx

            return (
              <button
                key={`rent-${opt.hours}-${idx}`}
                type="button"
                onClick={() => onSelect(idx)}
                className={`rounded-[14px] p-3 text-center transition-all cursor-pointer ${
                  selected
                    ? 'bg-zinc-700/40 border border-zinc-500/60 text-white'
                    : 'bg-white/5 border border-white/10 hover:border-white/30'
                }`}
              >
                <span
                  className={`font-figtree text-[16px] font-medium tracking-[-0.04em] block ${
                    selected ? 'text-white' : 'text-white'
                  }`}
                >
                  ${(opt.cost ?? 0).toFixed(2)}
                </span>
                <span
                  className={`font-figtree text-[13px] font-semibold ${
                    selected ? 'text-white/70' : 'text-white/45'
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
