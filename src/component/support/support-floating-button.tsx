'use client'

import { useState, useCallback, memo, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  ExternalLink,
  Headset,
  Loader2,
  ArrowLeft,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { FamilyButton } from '@/component/ui/family-button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
  SheetFooter,
} from '@/component/ui/sheet'
import { sendSupportMessageAction, getPublicSupportConfigAction } from '@/actions/support.action'

type ViewState = 'options' | 'form' | 'success'

export const SupportFloatingButton = memo(function SupportFloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('options')
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['support-config'],
    queryFn: async () => {
      const result = await getPublicSupportConfigAction()
      return result.success ? result.data : { whatsapp: null, email: null }
    },
    staleTime: 5 * 60 * 1000,
    initialData: { whatsapp: null, email: null },
  })

  const resetState = useCallback(() => {
    setViewState('options')
    setMessage('')
    setIsSending(false)
  }, [])

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      resetState()
    }
    setIsExpanded(!isExpanded)
  }, [isExpanded, resetState])

  const handleOpenForm = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsExpanded(false)
      setMobileSheetOpen(true)
    } else {
      setViewState('form')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!message || message.trim().length < 10) {
      toast.error('Message trop court (min. 10 caractères)')
      return
    }

    setIsSending(true)
    try {
      const result = await sendSupportMessageAction({
        subject: 'Demande de support',
        content: message.trim(),
      })
      if (result.success) {
        setViewState('success')
        setTimeout(() => {
          setIsExpanded(false)
          setMobileSheetOpen(false)
          resetState()
        }, 3000)
      } else {
        toast.error(result.error || "Erreur lors de l'envoi")
        setIsSending(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi")
      setIsSending(false)
    }
  }, [message, resetState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewState === 'form') {
          setViewState('options')
        } else {
          setIsExpanded(false)
          setMobileSheetOpen(false)
          resetState()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, resetState])

  const successContent = useMemo(
    () => (
      <div className='flex flex-col items-center justify-center h-full p-4 text-center space-y-2'>
        <svg
          width='32'
          height='32'
          viewBox='0 0 32 32'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='-mt-1'
        >
          <path
            d='M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z'
            fill='hsl(var(--primary))'
            fillOpacity='0.16'
          />
          <path
            d='M12.1334 16.9667L15.0334 19.8667L19.8667 13.1M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z'
            stroke='hsl(var(--primary))'
            strokeWidth='2.4'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
        <h4 className='text-xs font-bold text-primary'>Envoyé !</h4>
        <p className='text-[10px] text-muted-foreground max-w-[160px]'>
          Notre équipe vous répondra très bientôt.
        </p>
      </div>
    ),
    []
  )

  const formContent = useMemo(
    () => (
      <div className='flex flex-col h-full'>
        <div className='flex items-center gap-2 px-3 pt-3 pb-2'>
          <button
            onClick={() => setViewState('options')}
            className='p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
          </button>
          <span className='text-[11px] font-bold text-foreground'>Message</span>
        </div>
        <div className='flex-1 px-3'>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Votre message...'
            className='w-full h-20 resize-none rounded-xl bg-muted/30 border border-border p-2.5 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30'
          />
        </div>
        <div className='px-3 pb-3 pt-1'>
          <button
            onClick={handleSubmit}
            disabled={isSending || !message.trim()}
            className='w-full h-8 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors'
          >
            {isSending ? (
              <Loader2 className='animate-spin h-3 w-3' />
            ) : (
              <>
                <Send className='h-3 w-3' />
                Envoyer
              </>
            )}
          </button>
        </div>
      </div>
    ),
    [message, isSending, handleSubmit]
  )

  const optionsContent = useMemo(
    () => (
      <div className='flex flex-col items-center gap-2 p-4'>
        <div className='flex flex-col items-center gap-1 mb-1'>
          <h3 className='text-[10px] font-black uppercase tracking-[0.2em] text-primary'>
            Besoin d&apos;aide ?
          </h3>
          <p className='text-[9px] text-muted-foreground font-medium'>Assistance 24/7</p>
        </div>
        <div className='flex flex-col gap-2 w-full'>
          {config?.whatsapp && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`https://wa.me/${config.whatsapp}`}
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => setIsExpanded(false)}
              className='flex items-center justify-between w-full px-3 py-2 rounded-xl bg-success/5 border border-success/10 hover:bg-success/10 transition-all group'
            >
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-lg bg-success/20 shadow-inner'>
                  <Phone className='h-3.5 w-3.5 text-success' />
                </div>
                <span className='text-[11px] font-bold text-foreground'>WhatsApp</span>
              </div>
              <ExternalLink className='h-3 w-3 text-muted-foreground group-hover:text-success transition-colors' />
            </motion.a>
          )}

          {config?.email && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`mailto:${config.email}`}
              onClick={() => setIsExpanded(false)}
              className='flex items-center justify-between w-full px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group'
            >
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-lg bg-blue-500/20 shadow-inner'>
                  <Mail className='h-3.5 w-3.5 text-blue-400' />
                </div>
                <span className='text-[11px] font-bold text-foreground'>Email</span>
              </div>
              <ExternalLink className='h-3 w-3 text-muted-foreground group-hover:text-blue-400 transition-colors' />
            </motion.a>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenForm}
            className='flex items-center justify-between w-full px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group'
          >
            <div className='flex items-center gap-2.5'>
              <div className='p-1.5 rounded-lg bg-primary/20 shadow-inner'>
                <MessageSquare className='h-3.5 w-3.5 text-primary' />
              </div>
              <span className='text-[11px] font-bold text-foreground'>Message Direct</span>
            </div>
            <Send className='h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors' />
          </motion.button>
        </div>
      </div>
    ),
    [config?.whatsapp, config?.email, handleOpenForm]
  )

  return (
    <div className='fixed bottom-20 right-4 z-[100] md:bottom-6 md:right-6'>
      <FamilyButton icon={Headset} isExpanded={isExpanded} onToggle={handleToggle}>
        <AnimatePresence mode='wait'>
          {viewState === 'success' && (
            <motion.div
              key='success'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='w-full h-full'
            >
              {successContent}
            </motion.div>
          )}
          {viewState === 'form' && (
            <motion.div
              key='form'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className='w-full h-full'
            >
              {formContent}
            </motion.div>
          )}
          {viewState === 'options' && (
            <motion.div
              key='options'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className='w-full h-full'
            >
              {optionsContent}
            </motion.div>
          )}
        </AnimatePresence>
      </FamilyButton>

      {/* Mobile Sheet */}
      <Sheet
        open={mobileSheetOpen}
        onOpenChange={(open) => {
          setMobileSheetOpen(open)
          if (!open) resetState()
        }}
      >
        <SheetContent
          side='bottom'
          className='h-[84vh] max-w-none rounded-t-2xl border-t border-border'
        >
          <SheetHeader>
            <SheetTitle className='text-xl font-bold tracking-tight flex items-center gap-2'>
              <Headset className='h-5 w-5 text-primary' />
              Support
            </SheetTitle>
            <SheetDescription className='text-muted-foreground'>
              Notre équipe est là pour vous aider 24/7.
            </SheetDescription>
          </SheetHeader>

          <SheetPanel className='py-6'>
            <AnimatePresence mode='popLayout'>
              {viewState === 'success' ? (
                <motion.div
                  key='success'
                  initial={{ y: -32, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                  className='flex flex-col items-center justify-center p-8 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-2'
                >
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 32 32'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z'
                      fill='hsl(var(--primary))'
                      fillOpacity='0.16'
                    />
                    <path
                      d='M12.1334 16.9667L15.0334 19.8667L19.8667 13.1M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z'
                      stroke='hsl(var(--primary))'
                      strokeWidth='2.4'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <h4 className='text-sm font-bold text-primary'>Message envoyé !</h4>
                  <p className='text-xs text-muted-foreground'>
                    Notre équipe vous répondra très bientôt.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key='form'
                  exit={{ y: 8, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                  className='space-y-4'
                >
                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder='Votre message...'
                      className='w-full h-40 bg-muted/30 rounded-2xl border border-border p-4 text-sm resize-none outline-none text-foreground placeholder:text-muted-foreground leading-relaxed font-medium transition-all focus:border-primary/30 focus:bg-muted/50'
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SheetPanel>

          {viewState !== 'success' && (
            <SheetFooter className='p-6 pt-0 mt-auto sm:flex-row gap-3'>
              <button
                onClick={() => {
                  setMobileSheetOpen(false)
                  resetState()
                }}
                disabled={isSending}
                className='flex-1 rounded-xl h-11 border border-border bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50'
              >
                Fermer
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSending || !message.trim()}
                className='flex-[2] rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {isSending ? <Loader2 className='animate-spin size-4' /> : 'Envoyer'}
              </button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
})
