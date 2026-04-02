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
      className={`
        flex h-6 w-6 shrink-0 items-center justify-center rounded-full
        border-2 transition-all duration-200
        ${
          active
            ? 'border-primary bg-primary text-primary-foreground scale-100'
            : 'border-muted-foreground/20 bg-transparent scale-90'
        }
      `}
    >
      {active && <Check className='h-3.5 w-3.5' strokeWidth={3} />}
    </div>
  )
})
