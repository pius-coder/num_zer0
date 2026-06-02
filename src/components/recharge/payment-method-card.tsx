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
      className={`group relative flex w-full items-center gap-4 p-4 text-left transition-all duration-200 ease-out cursor-pointer focus-visible:outline-none ${
        active ? 'scale-[1.02]' : ''
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
          active ? activeColor : color
        }`}
      >
        <PaymentMethodIcon src={iconSrc} alt={iconAlt} isWallet={isWallet} />
      </div>

      <div className='flex-1 min-w-0'>
        <p className={`font-figtree text-[18px] font-medium tracking-[-0.04em] leading-[1.25] ${
          active ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'
        }`}>
          {label}
        </p>
        <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
          {desc}
        </p>
      </div>

      <PaymentMethodCheck active={active} />
    </button>
  )
})
