'use client'

import { useCallback, useMemo } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { ActiveActivationCard } from './active-activation-card'
import { CompletedActivationRow } from './completed-activation-row'
import { useCancelActivation } from '@/hooks/use-numbers'
import type { ActivationInfo } from '@/type/activation'

interface ActivationsListProps {
  activations?: ActivationInfo[]
  isLoading?: boolean
  onRefetch?: () => void
  onActivationClick?: (id: string) => void
}

export function ActivationsList({
  activations = [],
  isLoading = false,
  onRefetch,
  onActivationClick,
}: ActivationsListProps) {
  const cancelMutation = useCancelActivation()

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
  }, [])

  const handleCancel = useCallback(
    (id: string) => {
      cancelMutation.mutate(id)
    },
    [cancelMutation]
  )

  const active = useMemo(
    () => activations.filter((a) => ['requested', 'assigned', 'waiting'].includes(a.state)),
    [activations]
  )
  const completed = useMemo(
    () => activations.filter((a) => ['completed', 'cancelled', 'expired'].includes(a.state)),
    [activations]
  )

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div>
      {active.length > 0 && (
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
              Actifs ({active.length})
            </h3>
            <button
              onClick={onRefetch}
              className='p-1 text-muted-foreground hover:text-foreground transition-colors'
            >
              <RefreshCw className='size-4' />
            </button>
          </div>
          <div className='flex flex-col gap-2'>
            {active.map((act) => (
              <ActiveActivationCard
                key={act.id}
                activation={act}
                onCopy={handleCopy}
                onCancel={handleCancel}
                onClick={onActivationClick ? () => onActivationClick(act.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
            Historique ({completed.length})
          </h3>
          <div className='flex flex-col gap-1.5'>
            {completed.map((act) => (
              <CompletedActivationRow key={act.id} activation={act} onCopy={handleCopy} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
