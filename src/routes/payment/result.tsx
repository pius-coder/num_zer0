import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/common/ui/button'
import { useVerifyPaymentIntent } from '#/components/wallet/hooks'

export const Route = createFileRoute('/payment/result')({
  head: () => ({
    meta: [
      { title: 'Vérification du paiement - num_zer0' },
      { name: 'description', content: 'Vérification de votre paiement en cours' },
    ],
  }),
  component: PaymentResultPage,
  validateSearch: (search: Record<string, unknown>) => ({
    transId: (search.transId as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

type VerificationStatus = 'verifying' | 'success' | 'failed' | 'error' | 'no_transaction'

function PaymentResultPage() {
  const { transId, status } = Route.useSearch()
  const navigate = useNavigate()
  const verifyPayment = useVerifyPaymentIntent()

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verifying')
  const [verificationMessage, setVerificationMessage] = useState('Vérification du paiement en cours...')

  useEffect(() => {
    const resolvedTransId =
      !transId || transId === '{transId}' ? sessionStorage.getItem('fapshi_transId') : transId

    if (!resolvedTransId) {
      setVerificationStatus('no_transaction')
      setVerificationMessage('Aucune référence de paiement trouvée')
      return
    }

    if (status !== 'SUCCESSFUL') {
      setVerificationStatus('failed')
      const msg =
        status === 'FAILED'
          ? 'Le paiement a échoué'
          : status === 'EXPIRED'
            ? 'Le paiement a expiré'
            : 'Le paiement a été annulé ou a échoué'
      setVerificationMessage(msg)
      toast.error(msg)
      return
    }

    setVerificationStatus('verifying')
    setVerificationMessage('Vérification du paiement en cours...')

    verifyPayment.mutate(
      { gatewayTransactionId: resolvedTransId },
      {
        onSuccess: (result: any) => {
          if (result.success) {
            sessionStorage.removeItem('fapshi_transId')
            setVerificationStatus('success')
            setVerificationMessage('Votre compte a été crédité avec succès !')
            toast.success('Compte crédité avec succès !')
          } else {
            setVerificationStatus('failed')
            const msg = `Statut: ${result.status ?? 'inconnu'}`
            setVerificationMessage(msg)
            toast.error(msg)
          }
        },
        onError: (err: Error) => {
          setVerificationStatus('error')
          const msg =
            err instanceof Error ? err.message : 'Erreur lors de la vérification'

          if (msg.includes('Not authenticated')) {
            setVerificationMessage('Session expirée, veuillez vous reconnecter')
            toast.error('Session expirée, veuillez vous reconnecter')
            return
          }

          setVerificationMessage(msg)
          toast.error(msg)
        },
      },
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const iconMap: Record<VerificationStatus, { icon: React.ReactNode; bg: string; color: string }> = {
    success: {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      ),
      bg: 'bg-green-100 dark:bg-green-900/30',
      color: 'text-green-600',
    },
    failed: {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      ),
      bg: 'bg-red-100 dark:bg-red-900/30',
      color: 'text-red-600',
    },
    error: {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      ),
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      color: 'text-orange-600',
    },
    no_transaction: {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      ),
      bg: 'bg-gray-100 dark:bg-gray-800',
      color: 'text-gray-500',
    },
    verifying: {
      icon: null,
      bg: '',
      color: '',
    },
  }

  const current = iconMap[verificationStatus]

  return (
    <div className="mx-auto max-w-6xl px-3 pb-4 pt-8 md:px-6 md:pb-8">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">
          {verificationStatus === 'verifying' ? (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--lagoon)] border-t-transparent mx-auto" />
          ) : (
            <div className={`h-16 w-16 rounded-full ${current.bg} flex items-center justify-center mx-auto`}>
              <svg className={`w-8 h-8 ${current.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {current.icon}
              </svg>
            </div>
          )}
        </div>

        <h1 className="font-figtree text-[var(--sea-ink)] text-[22px] font-bold tracking-[-0.04em] leading-[1.25]">
          {verificationStatus === 'verifying' && 'Vérification en cours'}
          {verificationStatus === 'success' && 'Paiement confirmé'}
          {verificationStatus === 'failed' && 'Paiement échoué'}
          {verificationStatus === 'error' && 'Erreur de vérification'}
          {verificationStatus === 'no_transaction' && 'Transaction introuvable'}
        </h1>

        <p className="font-figtree text-[var(--sea-ink-soft)] text-base leading-relaxed">
          {verificationMessage}
        </p>

        <div className="pt-4">
          <Button onClick={() => navigate({ to: '/wallet' })}>
            Aller au wallet
          </Button>

          {verificationStatus === 'verifying' && (
            <p className="font-figtree text-sm text-[var(--sea-ink-soft)]/60 mt-3">
              Veuillez patienter pendant la vérification de votre transaction...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
