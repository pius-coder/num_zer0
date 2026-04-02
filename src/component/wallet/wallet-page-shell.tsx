'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useBalance, useTransactions, creditsKeys } from '@/hooks/use-credits'
import { useRechargeDrawer } from '@/component/recharge'
import { usePaymentStore } from '@/store/use-payment-store'
import { verifyFapshiPurchaseAction } from '@/actions/payment.action'
import { WalletBalanceCard } from './wallet-balance-card'
import { WalletTransactionList, type TransactionItem } from './wallet-transaction-list'
import { PendingPaymentBanner } from './pending-payment-banner'

const CREDIT_TYPES = new Set([
  'purchase',
  'bonus_signup',
  'bonus_referral',
  'bonus_promo',
  'bonus_vip',
  'bonus_first_purchase',
  'adjustment',
  'refund',
])

function isCreditType(type: string): boolean {
  return CREDIT_TYPES.has(type)
}

type PaymentFeedback =
  | { type: 'fapshi'; status: string | null; tx: string }
  | { type: 'legacy'; status: string; tx: string }
  | null

export function WalletPageShell() {
  const { data: balance, isLoading } = useBalance()
  const { data: transactionsData } = useTransactions()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { openRecharge } = useRechargeDrawer()
  const {
    hasSeenTransaction,
    markTransactionSeen,
    markVerified,
    clearPendingPurchase,
    setVerifying,
  } = usePaymentStore()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const transactions = useMemo((): TransactionItem[] => {
    const items = transactionsData?.items ?? []
    return items.map((tx) => ({
      id: tx.id,
      label: tx.description ?? tx.type,
      date: tx.createdAt,
      amountCredits: tx.amount,
      kind: isCreditType(tx.type) ? 'credit_purchase' : 'number_purchase',
    }))
  }, [transactionsData])

  const paymentFeedback = useMemo((): PaymentFeedback => {
    const fapshiTransId = searchParams.get('transId')
    const fapshiStatus = searchParams.get('status')
    const idempotencyId = searchParams.get('idempotencyId')
    const legacyStatus = searchParams.get('paymentStatus')
    const legacyTx = searchParams.get('tx')

    if (fapshiTransId) return { type: 'fapshi', status: fapshiStatus, tx: fapshiTransId }
    if (idempotencyId) return { type: 'fapshi', status: 'pending', tx: idempotencyId }
    if (legacyStatus && legacyTx) return { type: 'legacy', status: legacyStatus, tx: legacyTx }
    return null
  }, [searchParams])

  const reloadBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: creditsKeys.all })
  }, [queryClient])

  // EFFECT 1: Handle URL redirect params (direct from Fapshi or legacy)
  useEffect(() => {
    if (!paymentFeedback) return
    if (hasSeenTransaction(paymentFeedback.tx)) return

    const handleUrlVerification = async () => {
      markTransactionSeen(paymentFeedback.tx)

      if (paymentFeedback.type === 'fapshi') {
        if (paymentFeedback.status === 'SUCCESSFUL') {
          setFeedback('Vérification de ton paiement en cours...')
          setVerifying(true)

          const result = await verifyFapshiPurchaseAction(paymentFeedback.tx)
          if (result.success) {
            markVerified(paymentFeedback.tx)
            setFeedback(
              `Félicitations ! Ton paiement (${paymentFeedback.tx}) a été vérifié et tes crédits ont été ajoutés.`
            )
            reloadBalance()
          } else {
            setVerifying(false)
            setFeedback(
              `La vérification a échoué: ${result.error}. Si tu as été débité, contacte le support.`
            )
          }
        } else if (paymentFeedback.status === 'FAILED') {
          setFeedback(`Désolé, le paiement pour la transaction ${paymentFeedback.tx} a échoué.`)
          clearPendingPurchase()
        } else {
          // status is null or 'pending' (idempotencyId case)
          setFeedback('Vérification de ton paiement en cours...')
        }
      } else {
        // Legacy flow
        if (paymentFeedback.status === 'success') {
          setFeedback(
            `Félicitations ! Ton paiement pour la transaction ${paymentFeedback.tx} a été confirmé.`
          )
          reloadBalance()
        } else {
          setFeedback(
            `Désolé, le paiement pour la transaction ${paymentFeedback.tx} a échoué ou a été annulé.`
          )
        }
      }
    }

    void handleUrlVerification()
  }, [
    paymentFeedback,
    hasSeenTransaction,
    markTransactionSeen,
    reloadBalance,
    clearPendingPurchase,
    setVerifying,
    markVerified,
  ])

  // EFFECT 2: Handle persistent pending payment from store (Active Checkout)
  useEffect(() => {
    if (!isHydrated) return

    const handlePersistentVerification = async () => {
      const {
        pendingPurchaseId: storePendingId,
        isVerifying: storeVerifying,
        setVerifying: storeSetVerifying,
        markVerified: storeMarkVerified,
      } = usePaymentStore.getState()

      if (!storePendingId || storeVerifying) return

      const result = await verifyFapshiPurchaseAction(storePendingId)

      if (result.success) {
        storeMarkVerified(storePendingId)
        setFeedback('Paiement récupéré ! Crédits ajoutés.')
        reloadBalance()
      }
    }

    void handlePersistentVerification()
  }, [isHydrated, reloadBalance])

  return (
    <div className='mx-auto max-w-6xl space-y-5 px-3 pb-4 md:px-6 md:pb-8'>
      <div className='sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-background/80 backdrop-blur-xl border-b border-border'>
        <WalletBalanceCard
          balance={balance ?? null}
          loading={isLoading}
          onRecharge={openRecharge}
        />
      </div>

      <div className='space-y-4'>
        <PendingPaymentBanner onVerified={reloadBalance} />

        {feedback && (
          <div className='px-1 py-1 flex items-center gap-2 text-sm text-primary transition-all animate-in fade-in slide-in-from-top-1'>
            <div className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
            {feedback}
          </div>
        )}

        <WalletTransactionList transactions={transactions} />
      </div>
    </div>
  )
}
