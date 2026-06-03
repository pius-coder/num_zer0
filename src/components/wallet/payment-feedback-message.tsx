'use client'

import { memo } from 'react'
import { X } from 'lucide-react'

interface PaymentFeedbackMessageProps {
  message: string
  onClose?: () => void
}

export const PaymentFeedbackMessage = memo(function PaymentFeedbackMessage({
  message,
  onClose,
}: PaymentFeedbackMessageProps) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="h-2 w-2 rounded-full animate-pulse bg-[var(--lagoon)]" />
      <span className="flex-1 font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]">
        {message}
      </span>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 cursor-pointer">
          <X className="h-4 w-4 text-[var(--sea-ink-soft)]" />
        </button>
      )}
    </div>
  )
})
