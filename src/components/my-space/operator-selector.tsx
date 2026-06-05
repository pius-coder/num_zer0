'use client'

import { useState } from 'react'

interface OperatorSelectorProps {
  operators: string[]
  selectedOp: string
  onSelect: (op: string) => void
  availableCount: number
}

export function OperatorSelector({
  operators,
  selectedOp,
  onSelect,
  availableCount,
}: OperatorSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full font-figtree text-[15px] font-semibold uppercase tracking-wider flex items-center justify-between px-4 py-[10px] rounded-[18px] bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 ring-1 ring-[var(--line)]/30 cursor-pointer transition-all duration-200 hover:brightness-110"
        style={{
          boxShadow:
            '0 26px 75px rgba(0,0,0,0.42), 0 10px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.03), inset 0 1px 0 var(--inset-glint), inset 1px 0 0 rgba(255,255,255,0.015), inset -1px 0 0 rgba(0,0,0,0.22), inset 0 -1px 0 rgba(0,0,0,0.24)',
        }}
      >
        <span className="text-[var(--sea-ink-soft)]">
          {selectedOp === 'any' ? 'Opérateur' : selectedOp}
        </span>
        <span className="text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight ml-3">
          {selectedOp === 'any' ? 'Tous' : '▼'}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute z-20 w-full mt-2 bg-[var(--surface)] backdrop-blur-xl rounded-[18px] border border-[var(--line)]/50 ring-1 ring-[var(--line)]/30 overflow-hidden"
            style={{
              boxShadow:
                '0 26px 75px rgba(0,0,0,0.42), 0 10px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.03), inset 0 1px 0 var(--inset-glint), inset 1px 0 0 rgba(255,255,255,0.015), inset -1px 0 0 rgba(0,0,0,0.22), inset 0 -1px 0 rgba(0,0,0,0.24)',
            }}
          >
            <div className="px-2 py-2 space-y-1">
              <button
                key="any"
                onClick={() => {
                  onSelect('any')
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] font-figtree text-[15px] font-semibold cursor-pointer transition-colors hover:bg-white/5 ${
                  selectedOp === 'any' ? 'text-[#F97316] bg-white/5' : 'text-white'
                }`}
              >
                <span>Tous les opérateurs</span>
                <span className="text-white/45">{availableCount} pcs</span>
              </button>
              {operators.map((op) => (
                <button
                  key={op}
                  onClick={() => {
                    onSelect(op)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] font-figtree text-[15px] font-semibold cursor-pointer transition-colors hover:bg-white/5 ${
                    selectedOp === op ? 'text-[#F97316] bg-white/5' : 'text-white'
                  }`}
                >
                  <span>{op}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
