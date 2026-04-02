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
    <div className='flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success'>
      <div className='h-2 w-2 rounded-full bg-success animate-pulse' />
      <span className='flex-1'>{message}</span>
      {onClose && (
        <button
          type='button'
          onClick={onClose}
          className='shrink-0 text-success/70 hover:text-success transition-colors'
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  )
})
