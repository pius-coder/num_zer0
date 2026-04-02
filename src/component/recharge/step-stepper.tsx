'use client'

interface StepStepperProps {
  step: number
  total: number
}

export function StepStepper({ step, total }: StepStepperProps) {
  return (
    <span className='text-[11px] font-semibold text-muted-foreground font-[family-name:var(--font-geist-mono)]'>
      {step + 1}/{total}
    </span>
  )
}
