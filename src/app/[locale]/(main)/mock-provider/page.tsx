'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function MockProviderPage() {
  const searchParams = useSearchParams()

  const payload = useMemo(() => {
    const purchaseId = searchParams.get('purchaseId') ?? ''
    const method = searchParams.get('method') ?? 'unknown'
    const returnTo = searchParams.get('returnTo') ?? '/en/wallet'
    return { purchaseId, method, returnTo }
  }, [searchParams])

  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const triggerWebhook = async (status: 'success' | 'failed') => {
    setIsProcessing(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/webhooks/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: payload.purchaseId,
          status,
          gatewayId: 'mock_gateway_99',
          paymentRef: payload.purchaseId, // Simulating that the ref IS the purchase ID
          reason: status === 'failed' ? 'User cancelled in mock' : undefined
        })
      })
      if (!res.ok) throw new Error('Webhook failed')
      setFeedback(`Webhook ${status} envoyé avec succès !`)
    } catch (e) {
      setFeedback('Erreur lors de l\'envoie du webhook.')
    } finally {
      setIsProcessing(false)
    }
  }

  const successHref = `${payload.returnTo}?paymentStatus=success&tx=${encodeURIComponent(payload.purchaseId)}`
  const failedHref = `${payload.returnTo}?paymentStatus=failed&tx=${encodeURIComponent(payload.purchaseId)}`

  return (
    <div className='mx-auto max-w-2xl px-4 py-12 space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-bold'>Simulateur de Paiement</h1>
        <p className='text-muted-foreground'>
          Cette page simule une interface de paiement externe (Stripe, MTN, Orange Money).
        </p>
      </div>

      <div className='p-6 rounded-2xl border bg-card shadow-sm space-y-6'>
        <div className='grid gap-4 text-sm'>
          <div className='flex justify-between border-b pb-2'>
            <span className='text-muted-foreground'>ID de Transaction</span>
            <span className='font-mono font-medium'>{payload.purchaseId || 'n/a'}</span>
          </div>
          <div className='flex justify-between border-b pb-2'>
            <span className='text-muted-foreground'>Méthode de Paiement</span>
            <span className='font-medium uppercase'>{payload.method}</span>
          </div>
        </div>

        {feedback && (
          <div className={`p-3 rounded-lg text-sm ${feedback.includes('Erreur') ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {feedback}
          </div>
        )}

        <div className='grid gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              onClick={() => triggerWebhook('success')}
              disabled={isProcessing || !payload.purchaseId}
              className='bg-emerald-600 hover:bg-emerald-700'
            >
              1. Simuler Webhook Succès
            </Button>
            <Button
              variant='outline'
              onClick={() => triggerWebhook('failed')}
              disabled={isProcessing || !payload.purchaseId}
              className='border-destructive/30 text-destructive hover:bg-destructive/5'
            >
              1. Simuler Webhook Échec
            </Button>
          </div>

          <Separator />

          <div className='grid grid-cols-2 gap-3'>
            <Button variant='secondary' render={<Link href={successHref}>2. Retourner (Succès)</Link>} />
            <Button variant='ghost' render={<Link href={failedHref}>2. Retourner (Échec)</Link>} />
          </div>
        </div>
      </div>

      <p className='text-xs text-center text-muted-foreground italic'>
        Étape 1 met à jour la base de données via backend. Étape 2 simule la redirection utilisateur.
      </p>
    </div>
  )
}

