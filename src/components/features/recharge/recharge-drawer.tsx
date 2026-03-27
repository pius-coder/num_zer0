'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, CreditCard, Smartphone, Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
  SheetFooter,
} from '@/components/ui/sheet'
import { usePackages, useCreatePurchase, type CreditPackage } from '@/hooks/use-credits'

type PaymentMethod = 'mtn_momo' | 'orange_money' | 'card' | 'crypto'

interface RechargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedPackageId?: string | null
  onPurchased?: () => Promise<void> | void
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  mtn_momo: 'MTN MoMo',
  orange_money: 'Orange Money',
  card: 'Carte bancaire',
  crypto: 'Crypto',
}

export function RechargeDrawer({
  open,
  onOpenChange,
  preselectedPackageId,
  onPurchased,
}: RechargeDrawerProps) {
  const pathname = usePathname()

  const { data: packages = [], isLoading: loadingPackages } = usePackages()
  const createPurchaseMutation = useCreatePurchase()

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo')
  const [promoCode, setPromoCode] = useState('')
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? null,
    [packages, selectedPackageId]
  )

  // Initialize selected package
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageId) {
      if (preselectedPackageId) {
        setSelectedPackageId(preselectedPackageId)
      } else {
        setSelectedPackageId(packages[0].id)
      }
    }
  }, [packages, preselectedPackageId, selectedPackageId])

  const handleRecharge = async () => {
    if (!selectedPackage) return
    setResultMessage(null)

    try {
      const idempotencyKey = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      const data = await createPurchaseMutation.mutateAsync({
        packageId: selectedPackage.id,
        paymentMethod,
        idempotencyKey,
      })

      // We now get a real checkoutUrl from Fapshi integration
      if (data.checkoutUrl) {
        const { usePaymentStore } = await import('@/store/use-payment-store')
        usePaymentStore.getState().setPendingPurchase(
          data.purchase.id,
          selectedPackage.nameFr,
          selectedPackage.priceXaf
        )

        setResultMessage(
          `Redirection vers la plateforme de paiement... (Réf: ${data.purchase.id})`
        )
        window.location.href = data.checkoutUrl
      } else {
        // Fallback or legacy (mock)
        const locale = pathname.split('/').filter(Boolean)[0] ?? 'en'
        const returnTo = `/${locale}/wallet`
        const mockProviderUrl = `/${locale}/mock-provider?purchaseId=${encodeURIComponent(
          data.purchase.id
        )}&method=${encodeURIComponent(paymentMethod)}&returnTo=${encodeURIComponent(returnTo)}`

        window.location.href = mockProviderUrl
      }

      await onPurchased?.()
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : 'Erreur inattendue')
    }
  }

  useEffect(() => {
    if (!open) {
      setResultMessage(null)
      setPromoCode('')
    }
  }, [open])

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side='bottom' className='h-[84vh] max-w-none rounded-t-2xl'>
        <SheetHeader>
          <SheetTitle>Recharger mes crédits</SheetTitle>
          <SheetDescription>
            Sélectionne un forfait puis un moyen de paiement.
          </SheetDescription>
        </SheetHeader>

        <SheetPanel className='space-y-5'>
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>1. Forfait</h3>
            {loadingPackages ? (
              <div className='text-sm text-muted-foreground'>Chargement des forfaits...</div>
            ) : (
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {packages.map((pack) => {
                  const bonus = Math.floor((pack.credits * pack.bonusPct) / 100)
                  const active = selectedPackageId === pack.id
                  return (
                    <button
                      key={pack.id}
                      type='button'
                      onClick={() => setSelectedPackageId(pack.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
                        }`}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <p className='font-semibold'>{pack.nameFr}</p>
                        <p className='text-sm text-muted-foreground'>{pack.priceXaf} FCFA</p>
                      </div>
                      <p className='text-sm mt-1'>{pack.credits} crédits</p>
                      {bonus > 0 && <p className='text-xs text-primary mt-1'>+{bonus} bonus</p>}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>2. Paiement</h3>
            <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <TabsList className='grid grid-cols-4 w-full'>
                <TabsTrigger value='mtn_momo'>
                  <Smartphone className='h-4 w-4 mr-1' />
                  MoMo
                </TabsTrigger>
                <TabsTrigger value='orange_money'>
                  <Wallet className='h-4 w-4 mr-1' />
                  Orange
                </TabsTrigger>
                <TabsTrigger value='card'>
                  <CreditCard className='h-4 w-4 mr-1' />
                  Carte
                </TabsTrigger>
                <TabsTrigger value='crypto'>
                  <Coins className='h-4 w-4 mr-1' />
                  Crypto
                </TabsTrigger>
              </TabsList>

              <TabsContent value='mtn_momo' className='mt-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed'>
                Paiement via MTN Mobile Money. Redirection vers le portail sécurisé.
              </TabsContent>
              <TabsContent value='orange_money' className='mt-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed'>
                Paiement via Orange Money. Redirection vers le portail sécurisé.
              </TabsContent>
              <TabsContent value='card' className='mt-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed'>
                Paiement par Carte Bancaire. Redirection vers le portail sécurisé.
              </TabsContent>
              <TabsContent value='crypto' className='mt-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed'>
                Paiement via Crypto-monnaies. Redirection vers le portail sécurisé.
              </TabsContent>
            </Tabs>

            <Input
              placeholder='Code promo (optionnel)'
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </section>

          <section className='rounded-xl border p-3 text-sm'>
            <h3 className='font-semibold mb-1'>3. Récapitulatif</h3>
            <p>Forfait: {selectedPackage ? selectedPackage.nameFr : '—'}</p>
            <p>Moyen: {paymentMethodLabels[paymentMethod]}</p>
            <p>Total: {selectedPackage ? `${selectedPackage.priceXaf} FCFA` : '—'}</p>
            {promoCode.trim() && <p>Promo: {promoCode}</p>}
          </section>

          {resultMessage && (
            <section className='rounded-xl border p-3 text-sm bg-muted/30'>
              {resultMessage}
            </section>
          )}
        </SheetPanel>

        <SheetFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={createPurchaseMutation.isPending}>
            Fermer
          </Button>
          <Button onClick={() => void handleRecharge()} disabled={!selectedPackage || createPurchaseMutation.isPending}>
            {createPurchaseMutation.isPending ? 'Traitement...' : 'Confirmer le paiement'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

