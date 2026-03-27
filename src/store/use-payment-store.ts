import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PaymentState {
    pendingPurchaseId: string | null
    packageName: string | null
    amount: number | null
    initiationTime: number | null
    isVerifying: boolean
    lastVerifiedId: string | null
    setPendingPurchase: (id: string, packageName: string, amount: number) => void
    clearPendingPurchase: () => void
    setVerifying: (verifying: boolean) => void
    markVerified: (id: string) => void
}

export const usePaymentStore = create<PaymentState>()(
    persist(
        (set) => ({
            pendingPurchaseId: null,
            packageName: null,
            amount: null,
            initiationTime: null,
            isVerifying: false,
            lastVerifiedId: null,
            setPendingPurchase: (id, packageName, amount) => set({
                pendingPurchaseId: id,
                packageName,
                amount,
                initiationTime: Date.now(),
                isVerifying: false
            }),
            clearPendingPurchase: () => set({
                pendingPurchaseId: null,
                packageName: null,
                amount: null,
                initiationTime: null,
                isVerifying: false
            }),
            setVerifying: (verifying) => set({ isVerifying: verifying }),
            markVerified: (id) => set({
                lastVerifiedId: id,
                pendingPurchaseId: null,
                packageName: null,
                amount: null,
                initiationTime: null,
                isVerifying: false
            }),
        }),
        {
            name: 'numzero-payment-storage',
        }
    )
)
