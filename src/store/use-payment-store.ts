import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PaymentState {
  pendingPurchaseId: string | null
  packageName: string | null
  amount: number | null
  isVerifying: boolean
  lastVerifiedId: string | null
  seenTransactions: string[]
  setPendingPurchase: (id: string, packageName: string, amount: number) => void
  clearPendingPurchase: () => void
  setVerifying: (verifying: boolean) => void
  markVerified: (id: string) => void
  hasSeenTransaction: (txId: string) => boolean
  markTransactionSeen: (txId: string) => void
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      pendingPurchaseId: null,
      packageName: null,
      amount: null,
      isVerifying: false,
      lastVerifiedId: null,
      seenTransactions: [],
      setPendingPurchase: (id, packageName, amount) =>
        set({
          pendingPurchaseId: id,
          packageName,
          amount,
          isVerifying: false,
        }),
      clearPendingPurchase: () =>
        set({
          pendingPurchaseId: null,
          packageName: null,
          amount: null,
          isVerifying: false,
        }),
      setVerifying: (verifying) => set({ isVerifying: verifying }),
      markVerified: (id) =>
        set({
          lastVerifiedId: id,
          pendingPurchaseId: null,
          packageName: null,
          amount: null,
          isVerifying: false,
        }),
      hasSeenTransaction: (txId) => get().seenTransactions.includes(txId),
      markTransactionSeen: (txId) =>
        set((state) => ({
          seenTransactions: [...state.seenTransactions, txId],
        })),
    }),
    {
      name: 'numzero-payment-storage',
    }
  )
)
