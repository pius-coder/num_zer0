'use client'

import { useEffect } from 'react'
import { X, CheckCircle2, Copy } from 'lucide-react'

interface ActivationSheetProps {
  open: boolean
  onClose: () => void
  activationId: string | null
  phase: 'confirm' | 'waiting' | 'code-received'
  phoneNumber?: string | null
  smsCode?: string | null
  serviceName?: string
  countryCode?: string
  price?: number
  cancelEnabled?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onCopy?: (text: string) => void
}

export function ActivationSheet({
  open,
  onClose,
  activationId,
  phase,
  phoneNumber,
  smsCode,
  serviceName,
  countryCode,
  price,
  cancelEnabled = true,
  onConfirm,
  onCancel,
  onCopy,
}: ActivationSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    return undefined
  }, [open])

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-150 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[60] h-auto rounded-t-2xl border-t bg-background shadow-xl flex flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-150 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!open}
      >
        <div className='flex items-center justify-between px-4 py-4 border-b'>
          <h2 className='text-lg font-semibold'>
            {phase === 'confirm' && 'Confirm Purchase'}
            {phase === 'waiting' && 'Waiting for SMS'}
            {phase === 'code-received' && 'SMS Code Received'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-muted transition-colors'
            aria-label='Close'
          >
            <X className='size-5' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-6'>
          {phase === 'confirm' && (
            <div className='space-y-4'>
              <div className='rounded-xl bg-muted/50 p-4'>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-muted-foreground'>Service</span>
                  <span className='font-medium'>{serviceName || 'Unknown'}</span>
                </div>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-muted-foreground'>Country</span>
                  <span className='font-medium'>{countryCode || 'Unknown'}</span>
                </div>
                <div className='border-t my-2' />
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>Price</span>
                  <span className='font-bold text-lg'>{price || 0} cr</span>
                </div>
              </div>

              <p className='text-[11px] text-muted-foreground text-center leading-relaxed'>
                ⏱ Within 20 minutes, if the number doesn't receive SMS, the cost will be refunded to
                your balance.
              </p>

              <button
                onClick={onConfirm}
                className='w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors'
              >
                Confirm Purchase
              </button>
            </div>
          )}

          {phase === 'waiting' && (
            <div className='space-y-4'>
              <div className='flex flex-col items-center py-4'>
                <CheckCircle2 className='size-12 text-success mb-3' />
                <h4 className='font-semibold mb-1'>Number Assigned!</h4>
                {phoneNumber && (
                  <div className='mt-2 text-center'>
                    <p className='text-2xl font-mono font-bold tracking-wider'>{phoneNumber}</p>
                    <p className='text-xs text-muted-foreground mt-1 animate-pulse'>
                      Waiting for SMS...
                    </p>
                  </div>
                )}
              </div>

              <div className='w-full bg-muted/30 rounded-full h-2 overflow-hidden'>
                <div className='h-full bg-primary animate-pulse' style={{ width: '60%' }} />
              </div>

              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => phoneNumber && onCopy?.(phoneNumber)}
                  className='w-full rounded-xl border py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors'
                >
                  <Copy className='size-4 inline mr-2' />
                  Copy Number
                </button>

                <button
                  onClick={onCancel}
                  disabled={!cancelEnabled}
                  className='w-full rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50'
                >
                  Cancel & Refund
                </button>
              </div>
            </div>
          )}

          {phase === 'code-received' && (
            <div className='space-y-4'>
              <div className='flex flex-col items-center py-4'>
                <CheckCircle2 className='size-12 text-success mb-3' />
                <h4 className='font-semibold mb-1'>Code Received!</h4>
                {phoneNumber && (
                  <p className='font-mono font-bold text-lg tracking-wider mb-2'>{phoneNumber}</p>
                )}
                <div className='w-full rounded-xl bg-success/10 border border-success/20 p-4 text-center'>
                  <p className='text-xs text-success mb-1'>SMS Code:</p>
                  <p className='text-3xl font-mono font-bold tracking-widest text-success'>
                    {smsCode || '------'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => smsCode && onCopy?.(smsCode)}
                className='w-full rounded-xl border py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors'
              >
                <Copy className='size-4 inline mr-2' />
                Copy Code
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
