'use client'

import { memo } from 'react'

interface WalletCtaFooterProps {
  onRecharge: () => void
}

export const WalletCtaFooter = memo(function WalletCtaFooter({ onRecharge }: WalletCtaFooterProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={onRecharge}
        className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] px-4 py-2.5 cursor-pointer"
      >
        Recharger des crédits
      </button>
      <a
        href="/my-space"
        className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider px-4 py-2.5 text-center inline-block"
      >
        Parcourir les services
      </a>
    </div>
  )
})
