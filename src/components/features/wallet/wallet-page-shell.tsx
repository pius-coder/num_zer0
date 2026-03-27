'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { WalletBalanceCard } from './wallet-balance-card'
import { WalletTransactionList } from './wallet-transaction-list'
import { useRechargeDrawer } from '@/components/features/recharge'
import { useBalance, creditKeys } from '@/hooks/use-credits'
import { createLogger } from '@/lib/logger'
import { PendingPaymentBanner } from './pending-payment-banner'

const log = createLogger({ prefix: 'wallet-shell' })

export function WalletPageShell() {
  const { data: balance, isLoading, refetch } = useBalance()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { hasSeenTransaction, markTransactionSeen } = useRechargeDrawer()

  // Payment store logic
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const paymentFeedback = useMemo(() => {
    // Current legacy/other provider params
    const status = searchParams.get('paymentStatus')
    const tx = searchParams.get('tx')

    // Fapshi specific params from redirect
    const fapshiTransId = searchParams.get('transId')
    const fapshiStatus = searchParams.get('status')
    const idempotencyId = searchParams.get('idempotencyId')

    if (fapshiTransId) return { type: 'fapshi', status: fapshiStatus, tx: fapshiTransId }
    if (idempotencyId) return { type: 'fapshi', status: 'pending', tx: idempotencyId }
    if (status && tx) return { type: 'legacy', status, tx }
    return null
  }, [searchParams])

  const reloadBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: creditKeys.balance() })
  }, [queryClient])

  // EFFECT 1: Handle parameters from URL (Direct Redirect)
  useEffect(() => {
    if (!paymentFeedback) return
    if (hasSeenTransaction(paymentFeedback.tx)) return

    const handleUrlVerification = async () => {
      markTransactionSeen(paymentFeedback.tx)

      if (paymentFeedback.type === 'fapshi') {
        const { verifyFapshiPurchase } = await import('@/app/actions/payment-actions')
        const { usePaymentStore } = await import('@/store/use-payment-store')

        setFeedback("Vérification de ton paiement en cours...")
        usePaymentStore.getState().setVerifying(true)

        const result = await verifyFapshiPurchase(paymentFeedback.tx)
        if (result.success) {
          usePaymentStore.getState().markVerified(paymentFeedback.tx)
          setFeedback(`Félicitations ! Ton paiement (${paymentFeedback.tx}) a été vérifié et tes crédits ont été ajoutés.`)
          reloadBalance()
        } else {
          usePaymentStore.getState().setVerifying(false)
          setFeedback(`La vérification a échoué: ${result.error}. Si tu as été débité, contacte le support.`)
        }
      } else {
        // Legacy/Mock flow
        if (paymentFeedback.status === 'success') {
          setFeedback(`Félicitations ! Ton paiement pour la transaction ${paymentFeedback.tx} a été confirmé.`)
          reloadBalance()
        } else {
          setFeedback(`Désolé, le paiement pour la transaction ${paymentFeedback.tx} a échoué ou a été annulé.`)
        }
      }
    }

    void handleUrlVerification()
  }, [hasSeenTransaction, markTransactionSeen, paymentFeedback, reloadBalance])

  // EFFECT 2: Handle persistent pending payment (Active Checkout)
  useEffect(() => {
    if (!isHydrated) return

    const handlePersistentVerification = async () => {
      const { usePaymentStore } = await import('@/store/use-payment-store')
      const { pendingPurchaseId, initiationTime, isVerifying, clearPendingPurchase, setVerifying, markVerified } = usePaymentStore.getState()

      if (!pendingPurchaseId || !initiationTime || isVerifying) return

      // ONLY verify if it's less than 2 minutes old
      const elapsedMs = Date.now() - initiationTime
      if (elapsedMs > 120000) {
        log.warn("pending_payment_timed_out", { pendingPurchaseId })
        clearPendingPurchase()
        return
      }

      setVerifying(true)

      const { verifyFapshiPurchase } = await import('@/app/actions/payment-actions')
      const result = await verifyFapshiPurchase(pendingPurchaseId)

      if (result.success) {
        markVerified(pendingPurchaseId)
        setFeedback(`Paiement récupéré ! Crédits ajoutés.`)
        reloadBalance()
      } else {
        setVerifying(false)
        // No feedback here, the Banner shows specific status
      }
    }

    void handlePersistentVerification()
  }, [isHydrated, reloadBalance])

  return (
    <div className='mx-auto max-w-6xl space-y-5 px-3 pb-4 md:px-6 md:pb-8'>
      <div className='sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.04]'>
        <WalletBalanceCard balance={balance ?? null} loading={isLoading} />
      </div>

      <div className="space-y-4">
        <PendingPaymentBanner onVerified={reloadBalance} />

        {feedback && (
          <div className='px-1 py-1 flex items-center gap-2 text-sm text-[#adfa1b] transition-all animate-in fade-in slide-in-from-top-1'>
            <div className="h-1.5 w-1.5 rounded-full bg-[#adfa1b] animate-pulse" />
            {feedback}
          </div>
        )}

        <WalletTransactionList />
      </div>
    </div>
  )
}

