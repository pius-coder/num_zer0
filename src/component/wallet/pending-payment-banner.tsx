'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw, Clock, Check, X } from 'lucide-react'
import { usePaymentStore } from '@/store/use-payment-store'
import { verifyFapshiPurchaseAction, cancelPendingPurchaseAction } from '@/actions/payment.action'

interface PendingPaymentBannerProps {
  onVerified?: () => void
}

const WHATSAPP_NUMBER = '237600000000'
const LIFETIME_MS = 120_000
const POLL_INTERVAL_MS = 15_000

export function PendingPaymentBanner({ onVerified }: PendingPaymentBannerProps) {
  const {
    pendingPurchaseId,
    packageName,
    amount,
    isVerifying,
    setVerifying,
    markVerified,
    clearPendingPurchase,
  } = usePaymentStore()

  const [startTime] = useState(Date.now())
  const [localFeedback, setLocalFeedback] = useState<string | null>(null)
  const isVerifyingRef = useRef(isVerifying)
  const actionTakenRef = useRef(false)

  useEffect(() => {
    isVerifyingRef.current = isVerifying
  }, [isVerifying])

  const elapsed = Date.now() - startTime
  const timeLeft = Math.max(0, Math.floor((LIFETIME_MS - elapsed) / 1000))
  const expired = timeLeft <= 0

  useEffect(() => {
    if (!pendingPurchaseId) return
    const interval = setInterval(() => {
      if (!isVerifyingRef.current && !actionTakenRef.current) {
        handleAutoVerify()
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [pendingPurchaseId])

  const handleAutoVerify = useCallback(async () => {
    if (!pendingPurchaseId || isVerifyingRef.current) return
    setVerifying(true)
    try {
      const result = await verifyFapshiPurchaseAction(pendingPurchaseId)
      if (result.success) {
        markVerified(pendingPurchaseId)
        setLocalFeedback('Succès ! Crédits ajoutés.')
        onVerified?.()
      } else {
        setVerifying(false)
      }
    } catch {
      setVerifying(false)
    }
  }, [pendingPurchaseId, setVerifying, markVerified, onVerified])

  const handleManualVerify = useCallback(async () => {
    if (!pendingPurchaseId || isVerifyingRef.current) return
    setLocalFeedback('Vérification en cours...')
    await handleAutoVerify()
  }, [pendingPurchaseId, handleAutoVerify])

  if (!pendingPurchaseId) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handlePaid = () => {
    if (actionTakenRef.current) return
    actionTakenRef.current = true
    const message = encodeURIComponent(
      `Bonjour, j'ai initié un paiement pour "${packageName ?? 'Forfait'}" de ${amount ?? 0} FCFA (réf: ${pendingPurchaseId.slice(-8)}) mais mes crédits ne sont pas apparus.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
  }

  const handleNotPaid = async () => {
    if (actionTakenRef.current) return
    actionTakenRef.current = true
    await cancelPendingPurchaseAction(pendingPurchaseId)
    clearPendingPurchase()
    setLocalFeedback('Paiement annulé.')
  }

  if (expired) {
    return (
      <div className='rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4'>
        <div className='flex items-start gap-3'>
          <div className='shrink-0 size-10 rounded-full bg-amber-500/10 flex items-center justify-center'>
            <Clock className='size-5 text-amber-500' />
          </div>
          <div className='flex-1'>
            <h4 className='text-sm font-semibold text-foreground'>Paiement non confirmé</h4>
            <p className='text-xs text-muted-foreground mt-1'>
              Délai expiré pour{' '}
              <span className='font-medium text-foreground'>{packageName ?? 'Forfait'}</span> (
              {amount ?? 0} FCFA). Réf:{' '}
              <span className='font-mono'>{pendingPurchaseId.slice(-8)}</span>
            </p>
          </div>
        </div>

        {localFeedback && <p className='text-xs font-medium text-amber-500'>{localFeedback}</p>}

        <div className='text-center py-1'>
          <p className='text-sm font-medium text-foreground'>Avez-vous effectué le paiement ?</p>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <button
            type='button'
            onClick={handlePaid}
            className='flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors'
          >
            <Check className='h-4 w-4' />
            Oui, j'ai payé
          </button>
          <button
            type='button'
            onClick={handleNotPaid}
            className='flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors'
          >
            <X className='h-4 w-4' />
            Non, annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4'>
      <div className='flex items-center gap-3'>
        <div className='shrink-0 size-10 rounded-full bg-amber-500/10 flex items-center justify-center'>
          {isVerifying ? (
            <Loader2 className='size-5 animate-spin text-amber-500' />
          ) : (
            <Clock className='size-5 text-amber-500' />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium'>
            {isVerifying ? 'Vérification en cours...' : 'Transaction en attente'}
          </p>
          <p className='text-xs text-muted-foreground'>
            {packageName ?? 'Forfait'} • {amount ?? 0} FCFA • Réf:{' '}
            <span className='font-mono'>{pendingPurchaseId.slice(-8)}</span>
          </p>
          {localFeedback && (
            <p className='text-xs font-medium text-amber-500 mt-1'>{localFeedback}</p>
          )}
        </div>
        <div className='text-right'>
          <p className='text-lg font-mono font-bold text-amber-500'>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <button
            type='button'
            onClick={handleManualVerify}
            disabled={isVerifying}
            className='inline-flex items-center gap-1 text-xs text-amber-500 hover:underline disabled:opacity-50'
          >
            {isVerifying ? (
              <Loader2 className='h-3 w-3 animate-spin' />
            ) : (
              <RefreshCw className='h-3 w-3' />
            )}
            Vérifier
          </button>
        </div>
      </div>
      <div
        className='absolute bottom-0 left-0 h-0.5 bg-amber-500/40 transition-all duration-1000'
        style={{ width: `${(timeLeft / (LIFETIME_MS / 1000)) * 100}%` }}
      />
    </div>
  )
}
