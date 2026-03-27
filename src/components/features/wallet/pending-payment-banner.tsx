'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { usePaymentStore } from '@/store/use-payment-store'
import { verifyFapshiPurchase } from '@/app/actions/payment-actions'

interface PendingPaymentBannerProps {
    onVerified?: () => void
}

export function PendingPaymentBanner({ onVerified }: PendingPaymentBannerProps) {
    const {
        pendingPurchaseId,
        packageName,
        amount,
        initiationTime,
        isVerifying,
        setVerifying,
        markVerified,
        clearPendingPurchase
    } = usePaymentStore()

    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [localFeedback, setLocalFeedback] = useState<string | null>(null)

    // Update countdown
    useEffect(() => {
        if (!initiationTime || !pendingPurchaseId) return

        const updateTimer = () => {
            const elapsed = Date.now() - initiationTime
            const remaining = Math.max(0, 120000 - elapsed)
            setTimeLeft(Math.floor(remaining / 1000))

            if (remaining <= 0) {
                clearPendingPurchase()
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [initiationTime, pendingPurchaseId, clearPendingPurchase])

    const handleManualVerify = useCallback(async (isAuto = false) => {
        if (!pendingPurchaseId || isVerifying) return

        if (!isAuto) setLocalFeedback("Vérification en cours...")
        setVerifying(true)

        try {
            const result = await verifyFapshiPurchase(pendingPurchaseId)
            if (result.success) {
                markVerified(pendingPurchaseId)
                setLocalFeedback("Succès ! Crédits ajoutés.")
                onVerified?.()
            } else {
                if (!isAuto) setLocalFeedback("Toujours en attente ou expiré.")
                setVerifying(false)
            }
        } catch (error) {
            if (!isAuto) setLocalFeedback("Erreur lors de la vérification.")
            setVerifying(false)
        }
    }, [pendingPurchaseId, isVerifying, setVerifying, markVerified, onVerified])

    // EFFECT 2: Auto-polling every 30 seconds
    useEffect(() => {
        if (!pendingPurchaseId || timeLeft === null || timeLeft <= 5) return

        const pollInterval = setInterval(() => {
            if (!isVerifying) {
                log.info('auto_polling_triggered', { pendingPurchaseId })
                handleManualVerify(true)
            }
        }, 30000) // 30 seconds

        return () => clearInterval(pollInterval)
    }, [pendingPurchaseId, timeLeft, isVerifying, handleManualVerify])

    if (!pendingPurchaseId || timeLeft === null) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl md:p-5"
            >
                {/* Glow Effect */}
                <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#adfa1b]/10 blur-[80px]" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#adfa1b]/10 text-[#adfa1b]">
                            {isVerifying ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Clock className="h-5 w-5" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-semibold text-white">
                                {isVerifying ? 'Vérification en cours...' : 'Transaction en attente'}
                            </h3>
                            <p className="text-sm text-white/50">
                                {packageName || 'Forfait'} • {amount || 0} FCFA • Réf: <span className="font-mono">{pendingPurchaseId.slice(-8)}</span>
                            </p>
                            {localFeedback && (
                                <p className="text-xs font-medium text-[#adfa1b]">
                                    {localFeedback}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end px-2">
                            <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Expire dans</span>
                            <span className="text-sm font-mono font-medium text-white/70">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isVerifying}
                            onClick={handleManualVerify}
                            className="h-9 gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0"
                        >
                            {isVerifying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Vérifier
                        </Button>
                    </div>
                </div>

                {/* Progress bar background */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/[0.05]" />
                {/* Active progress bar */}
                <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 120) * 100}%` }}
                    transition={{ ease: "linear", duration: 1 }}
                    className="absolute bottom-0 left-0 h-[2px] bg-[#adfa1b]/50 shadow-[0_0_8px_#adfa1b]"
                />
            </motion.div>
        </AnimatePresence>
    )
}
