'use client'

import { memo } from 'react'
import { Clock, CheckCircle2, XCircle, Copy } from 'lucide-react'
import { cn } from '@/common/css'

const STATE_CONFIG = {
  requested: { label: 'Demandé', color: 'text-blue-500', icon: Clock },
  assigned: { label: 'Attribué', color: 'text-amber-500', icon: Clock },
  completed: { label: 'Complété', color: 'text-success', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'text-muted-foreground', icon: XCircle },
  expired: { label: 'Expiré', color: 'text-destructive', icon: XCircle },
} as const

type StateConfig = (typeof STATE_CONFIG)[keyof typeof STATE_CONFIG]

interface ActivationData {
  id: string
  serviceSlug: string
  countryCode: string
  phoneNumber: string | null
  smsCode: string | null
  state: string
  creditsCharged: number
  timerExpiresAt: string | null
}

interface ActiveActivationCardProps {
  activation: ActivationData
  onCopy: (text: string) => void
  onCancel: (id: string) => void
  onClick?: () => void
}

export const ActiveActivationCard = memo(function ActiveActivationCard({
  activation,
  onCopy,
  onCancel,
  onClick,
}: ActiveActivationCardProps) {
  const stateConf: StateConfig =
    STATE_CONFIG[activation.state as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.requested
  // Dynamic UX overrides for the header
  let labelToShow: string = stateConf.label
  let colorClass = stateConf.color
  let IconComponent = stateConf.icon
  if (activation.state === 'requested') {
    if (activation.phoneNumber) {
      labelToShow = 'En attente'
      colorClass = 'text-amber-500'
      IconComponent = Clock
    } else {
      labelToShow = ''
      colorClass = 'text-amber-500'
      IconComponent = Clock
    }
  }
  const StateIcon = IconComponent

  // Cancel is enabled when timer has expired OR when timerExpiresAt is null (e.g. failed activations)
  const cancelEnabled =
    !activation.timerExpiresAt || new Date(activation.timerExpiresAt) <= new Date()

  const handleClick = () => {
    onClick?.()
  }

  return (
    <div
      className={`rounded-xl border bg-card p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClick()
            }
          : undefined
      }
    >
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <StateIcon className={cn('size-4', colorClass)} />
          <span className={cn('text-xs font-medium', colorClass)}>{labelToShow}</span>
        </div>
        <span className='text-xs text-muted-foreground'>{activation.creditsCharged} cr</span>
      </div>

      <div className='mb-2'>
        <p className='text-xs text-muted-foreground'>Service</p>
        <p className='font-medium text-sm'>{activation.serviceSlug}</p>
      </div>

      {activation.phoneNumber && (
        <div className='mb-2'>
          <p className='text-xs text-muted-foreground'>Numéro</p>
          <div className='flex items-center gap-2'>
            <p className='font-mono font-bold text-lg tracking-wider'>{activation.phoneNumber}</p>
            <button
              onClick={() => onCopy(activation.phoneNumber!)}
              className='p-1 text-muted-foreground hover:text-foreground'
            >
              <Copy className='size-3.5' />
            </button>
          </div>
        </div>
      )}

      {activation.state === 'requested' && !activation.phoneNumber && (
        <div className='mt-3 flex items-center gap-2'>
          <div className='flex-1'>
            <div className='h-1.5 rounded-full bg-amber-500/20 overflow-hidden'>
              <div
                className='h-full bg-amber-500 rounded-full animate-pulse'
                style={{ width: '60%' }}
              />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Achat en cours...</p>
          </div>
          <button
            onClick={() => onCancel(activation.id)}
            disabled={!cancelEnabled}
            className='text-xs text-destructive hover:underline disabled:opacity-40'
          >
            Annuler
          </button>
        </div>
      )}

      {activation.smsCode && (
        <div className='mt-3 rounded-lg bg-success/10 border border-success/20 p-3'>
          <p className='text-xs text-success mb-1'>Code SMS</p>
          <div className='flex items-center gap-2'>
            <p className='text-3xl font-mono font-bold tracking-widest text-success'>
              {activation.smsCode}
            </p>
            <button
              onClick={() => onCopy(activation.smsCode!)}
              className='p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30'
            >
              <Copy className='size-4' />
            </button>
          </div>
        </div>
      )}

      {!activation.smsCode && activation.state === 'assigned' && (
        <div className='flex items-center gap-2 mt-3'>
          <div className='flex-1'>
            <div className='h-1.5 rounded-full bg-amber-500/20 overflow-hidden'>
              <div className='h-full bg-amber-500 rounded-full animate-pulse w-3/5' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>En attente du SMS...</p>
          </div>
          <button
            onClick={() => onCancel(activation.id)}
            disabled={!cancelEnabled}
            className='text-xs text-destructive hover:underline disabled:opacity-40'
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  )
})
