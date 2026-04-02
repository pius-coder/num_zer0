'use client'

import { useState, useMemo, useCallback } from 'react'
import type { CreditPackage } from '@/type/credit'
import type { PaymentMethod } from './step-method'
import { StepPackage } from './step-package'
import { StepMethod } from './step-method'
import { StepSummary } from './step-summary'

export type { PaymentMethod }

const STEP_COUNT = 3

export const STEP_DESCRIPTIONS: Record<number, string> = {
  0: 'Sélectionnez le forfait qui vous convient',
  1: 'Sélectionnez la méthode de paiement',
  2: 'Vérifiez les infos de paiement avant de procéder',
}

interface PurchaseFlowProps {
  packages: CreditPackage[]
  preselectedPackageId?: string | null
  onConfirm: (packageId: string, method: PaymentMethod) => void
  onStepChange?: (step: number) => void
}

export function usePurchaseFlow({
  packages,
  preselectedPackageId,
  onConfirm,
  onStepChange,
}: PurchaseFlowProps) {
  const [step, setStep] = useState(0)
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(preselectedPackageId ?? null)
  const [method, setMethod] = useState<PaymentMethod | null>(null)

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === selectedPkgId) ?? null,
    [packages, selectedPkgId]
  )

  const canNext = step === 0 ? selectedPkgId !== null : step === 1 ? method !== null : true

  const next = useCallback(() => {
    if (step < STEP_COUNT - 1 && canNext) {
      const nextStep = step + 1
      setStep(nextStep)
      onStepChange?.(nextStep)
    }
  }, [step, canNext, onStepChange])

  const back = useCallback(() => {
    if (step > 0) {
      const prevStep = step - 1
      setStep(prevStep)
      onStepChange?.(prevStep)
    }
  }, [step, onStepChange])

  const handleConfirm = useCallback(() => {
    if (selectedPkgId && method) onConfirm(selectedPkgId, method)
  }, [selectedPkgId, method, onConfirm])

  return {
    step,
    stepCount: STEP_COUNT,
    canNext,
    selectedPkg,
    next,
    back,
    handleConfirm,
    renderStep: (
      <>
        {step === 0 && (
          <StepPackage packages={packages} selectedId={selectedPkgId} onSelect={setSelectedPkgId} />
        )}
        {step === 1 && <StepMethod selected={method} onSelect={setMethod} />}
        {step === 2 && selectedPkg && method && <StepSummary pkg={selectedPkg} method={method} />}
      </>
    ),
  }
}
