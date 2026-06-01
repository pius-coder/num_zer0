import { memo } from 'react'
import { PaymentMethodIcon } from './payment-method-icon'
import { PaymentMethodCheck } from './payment-method-check'

interface PaymentMethodCardProps {
  id: string
  label: string
  desc: string
  iconSrc: string
  iconAlt: string
  color: string
  activeColor: string
  active: boolean
  isWallet?: boolean
  onSelect: (id: string) => void
}

export const PaymentMethodCard = memo(function PaymentMethodCard({
  id,
  label,
  desc,
  iconSrc,
  iconAlt,
  color,
  activeColor,
  active,
  isWallet,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect(id)}
      className={`
        group relative flex w-full items-center gap-4 rounded-2xl border-2 p-4
        text-left transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${
          active
            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
            : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
        }
      `}
    >
      <div
        className={`
          flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
          transition-all duration-200
          ${active ? activeColor : color}
        `}
      >
        <PaymentMethodIcon src={iconSrc} alt={iconAlt} isWallet={isWallet} />
      </div>

      <div className='flex-1 min-w-0'>
        <p
          className={`
            text-sm font-bold tracking-tight
            font-[family-name:var(--font-bricolage-grotesque)]
            ${active ? 'text-primary' : 'text-foreground'}
          `}
        >
          {label}
        </p>
        <p className='text-xs text-muted-foreground'>{desc}</p>
      </div>

      <PaymentMethodCheck active={active} />
    </button>
  )
})
