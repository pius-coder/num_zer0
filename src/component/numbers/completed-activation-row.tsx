'use client'

import { memo } from 'react'
import { type Clock, CheckCircle2, XCircle, Copy } from 'lucide-react'
import { cn } from '@/common/css'

const STATE_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  completed: { label: 'Complété', color: 'text-success', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'text-muted-foreground', icon: XCircle },
  expired: { label: 'Expiré', color: 'text-destructive', icon: XCircle },
}

interface ActivationData {
  id: string
  serviceSlug: string
  countryCode: string
  smsCode: string | null
  state: string
  creditsCharged: number
}

interface CompletedActivationRowProps {
  activation: ActivationData
  onCopy: (text: string) => void
}

export const CompletedActivationRow = memo(function CompletedActivationRow({
  activation,
  onCopy,
}: CompletedActivationRowProps) {
  const stateConf = STATE_CONFIG[activation.state] || STATE_CONFIG.cancelled
  const StateIcon = stateConf.icon

  return (
    <div className='flex items-center gap-3 rounded-lg border bg-card/50 px-4 py-3'>
      <StateIcon className={cn('size-4 shrink-0', stateConf.color)} />
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{activation.serviceSlug}</p>
        <p className='text-xs text-muted-foreground'>
          {activation.countryCode} · {activation.creditsCharged} cr
        </p>
      </div>
      {activation.smsCode && (
        <div className='flex items-center gap-1'>
          <span className='font-mono text-sm font-bold text-success'>{activation.smsCode}</span>
          <button
            onClick={() => onCopy(activation.smsCode!)}
            className='p-0.5 text-muted-foreground hover:text-foreground'
          >
            <Copy className='size-3' />
          </button>
        </div>
      )}
      <span className={cn('text-[10px] font-medium', stateConf.color)}>{stateConf.label}</span>
    </div>
  )
})
