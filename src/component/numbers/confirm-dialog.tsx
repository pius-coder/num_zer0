'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ConfirmPurchaseSummary } from './confirm-purchase-summary'
import { ActivationActiveView } from './activation-active-view'
import {
  useRequestActivation,
  useCancelActivation,
  useRetryActivation,
  useActivation,
} from '@/hooks/use-numbers'
import type { CountryItem, SubProviderDetail } from '@/type/service'

interface ConfirmDialogProps {
  service: { slug: string; name: string; icon: string }
  country: CountryItem
  countryName: string
  subProvider?: SubProviderDetail | null
  onClose: () => void
  onSuccess: () => void
}

export function ConfirmDialog({
  service,
  country,
  countryName,
  subProvider,
  onClose,
  onSuccess,
}: ConfirmDialogProps) {
  const [phase, setPhase] = useState<'confirm' | 'active'>('confirm')
  const [activationId, setActivationId] = useState<string | null>(null)
  const prevActivationIdRef = useRef<string | null>(null)

  const requestMutation = useRequestActivation()
  const cancelMutation = useCancelActivation()
  const retryMutation = useRetryActivation()
  const liveActivation = useActivation(activationId, phase === 'active' && !!activationId)

  const handleConfirm = () => {
    requestMutation.mutate(
      {
        serviceCode: service.slug,
        countryCode: country.countryIso,
        holdTimeMinutes: 5,
        idempotencyKey: `buy_${service.slug}_${country.countryIso}_${Date.now()}`,
      },
      {
        onSuccess: (result) => {
          if (result.activationId) {
            setActivationId(result.activationId)
            prevActivationIdRef.current = result.activationId
            setPhase('active')
          }
        },
      }
    )
  }

  const handleCancel = () => {
    if (activationId) {
      cancelMutation.mutate(activationId, {
        onSuccess: () => {
          setPhase('confirm')
          setActivationId(null)
          prevActivationIdRef.current = null
          onSuccess()
        },
      })
    }
  }

  const handleRetry = () => {
    if (activationId) {
      const oldId = activationId
      retryMutation.mutate(
        {
          serviceCode: service.slug,
          countryCode: country.countryIso,
          holdTimeMinutes: 5,
          idempotencyKey: `retry_${service.slug}_${country.countryIso}_${Date.now()}`,
        },
        {
          onSuccess: (result) => {
            if (result.activationId) {
              setActivationId(result.activationId)
              prevActivationIdRef.current = result.activationId
              cancelMutation.mutate(oldId)
            }
          },
        }
      )
    }
  }

  const handleDone = () => {
    setPhase('confirm')
    setActivationId(null)
    prevActivationIdRef.current = null
    onSuccess()
  }

  const smsCode = liveActivation.data?.smsCode ?? null
  const phoneNumber = liveActivation.data?.phoneNumber ?? null
  const isRetryPending = retryMutation.isPending
  const isCancelPending = cancelMutation.isPending
  const rawError =
    requestMutation.error?.message ??
    retryMutation.error?.message ??
    cancelMutation.error?.message ??
    null
  const errorCode =
    (requestMutation.data as { errorCode?: string } | undefined)?.errorCode ??
    (retryMutation.data as { errorCode?: string } | undefined)?.errorCode ??
    undefined

  return (
    <>
      <div className='fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm' onClick={onClose} />
      <div className='fixed left-1/2 top-1/2 z-[60] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-2xl'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <img
              src={service.icon || '/assets/services/ot.webp'}
              alt={service.name}
              className='size-8 rounded-lg bg-muted object-contain'
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/assets/services/ot.webp'
              }}
            />
            <div>
              <h3 className='font-semibold text-sm'>{service.name}</h3>
              <p className='text-xs text-muted-foreground'>{countryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='size-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80'
          >
            <X className='size-3.5' />
          </button>
        </div>

        {phase === 'confirm' && (
          <ConfirmPurchaseSummary
            serviceName={service.name}
            countryName={countryName}
            availability={subProvider?.count ?? country.availability}
            priceCredits={subProvider?.priceCredits ?? country.priceCredits}
            isLoading={requestMutation.isPending}
            error={rawError}
            errorCode={errorCode}
            onConfirm={handleConfirm}
          />
        )}

        {phase === 'active' && (
          <ActivationActiveView
            smsCode={smsCode}
            phoneNumber={phoneNumber}
            isLoading={liveActivation.isLoading}
            isRetryPending={isRetryPending}
            isCancelPending={isCancelPending}
            retryError={rawError}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onDone={handleDone}
          />
        )}
      </div>
    </>
  )
}
