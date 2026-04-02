'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { usePackages, useCreatePurchase } from '@/hooks/use-credits'
import { usePaymentStore } from '@/store/use-payment-store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetPanel,
  SheetFooter,
} from '@/component/ui/sheet'
import { Button } from '@/component/ui/button'
import { StepStepper } from './step-stepper'
import { usePurchaseFlow, STEP_DESCRIPTIONS, type PaymentMethod } from './purchase-flow'

interface RechargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedPackageId?: string | null
}

export function RechargeDrawer({ open, onOpenChange, preselectedPackageId }: RechargeDrawerProps) {
  const { data: packages = [], isLoading } = usePackages()
  const createPurchaseMutation = useCreatePurchase()
  const { setPendingPurchase } = usePaymentStore()

  const [currentStep, setCurrentStep] = useState(0)

  const handleConfirm = useCallback(
    async (packageId: string, method: PaymentMethod) => {
      const idempotencyKey = `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      const data = await createPurchaseMutation.mutateAsync({
        packageId,
        paymentMethod: method,
        idempotencyKey,
      })

      const selectedPkg = packages.find((p) => p.id === packageId)
      setPendingPurchase(data.purchase.id, selectedPkg?.name ?? 'Forfait', data.purchase.priceXaf)

      window.location.href = data.payment.link
    },
    [createPurchaseMutation, packages, setPendingPurchase]
  )

  const flow = usePurchaseFlow({
    packages,
    preselectedPackageId,
    onConfirm: handleConfirm,
    onStepChange: setCurrentStep,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='h-[90vh] max-w-none rounded-t-2xl'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle>Recharger mes crédits</SheetTitle>
            <StepStepper step={flow.step} total={flow.stepCount} />
          </div>
          <p className='text-sm text-muted-foreground'>{STEP_DESCRIPTIONS[currentStep]}</p>
        </SheetHeader>

        <SheetPanel className='py-4'>
          {isLoading ? (
            <div className='text-sm text-muted-foreground text-center py-12'>
              Chargement des forfaits...
            </div>
          ) : (
            flow.renderStep
          )}
        </SheetPanel>

        <SheetFooter>
          <div className='flex w-full items-center justify-between'>
            <Button
              variant='ghost'
              size='sm'
              onClick={flow.back}
              disabled={flow.step === 0}
              className={flow.step === 0 ? 'opacity-0 pointer-events-none' : ''}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              Retour
            </Button>

            {flow.step < flow.stepCount - 1 ? (
              <Button size='sm' onClick={flow.next} disabled={!flow.canNext} className='px-6'>
                Continuer
              </Button>
            ) : (
              <Button
                size='sm'
                onClick={flow.handleConfirm}
                disabled={createPurchaseMutation.isPending}
                className='px-6'
              >
                {createPurchaseMutation.isPending ? 'Traitement...' : 'Confirmer le paiement'}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
