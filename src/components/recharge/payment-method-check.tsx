import { Check } from 'lucide-react'
import { memo } from 'react'

interface PaymentMethodCheckProps {
  active: boolean
}

export const PaymentMethodCheck = memo(function PaymentMethodCheck({
  active,
}: PaymentMethodCheckProps) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
        active
          ? 'text-[#25D366] scale-100'
          : 'text-[var(--sea-ink-soft)]/20 scale-90'
      }`}
    >
      {active && <Check className='h-3.5 w-3.5' strokeWidth={3} />}
    </div>
  )
})
