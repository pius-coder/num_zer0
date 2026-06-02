'use client'

import { useState, useCallback, memo } from 'react'
import { Phone, Mail, Headset } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { FamilyButton } from '#/common/ui/family-button'

export const SupportFloatingButton = memo(function SupportFloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  const optionsContent = (
    <div className='flex flex-col items-center gap-2 p-4'>
      <div className='flex flex-col items-center gap-1 mb-1'>
        <h3 className='text-[10px] font-black uppercase tracking-[0.2em] text-primary'>
          Besoin d&apos;aide ?
        </h3>
        <p className='text-[9px] text-muted-foreground font-medium'>Assistance 24/7</p>
      </div>
      <div className='flex flex-col gap-2 w-full'>
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href='https://wa.me/237600000000'
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => setIsExpanded(false)}
          className='flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all group'
        >
          <div className='flex items-center gap-2.5'>
            <div className='p-1.5 rounded-lg'>
              <Phone className='h-3.5 w-3.5 text-success' />
            </div>
            <span className='text-[11px] font-bold text-foreground'>WhatsApp</span>
          </div>
        </motion.a>

        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href='mailto:support@numzero.com'
          onClick={() => setIsExpanded(false)}
          className='flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all group'
        >
          <div className='flex items-center gap-2.5'>
            <div className='p-1.5 rounded-lg'>
              <Mail className='h-3.5 w-3.5 text-blue-400' />
            </div>
            <span className='text-[11px] font-bold text-foreground'>Email</span>
          </div>
        </motion.a>
      </div>
    </div>
  )

  return (
    <div className='fixed bottom-20 right-4 z-[100] md:bottom-6 md:right-6'>
      <FamilyButton icon={Headset} isExpanded={isExpanded} onToggle={handleToggle}>
        <AnimatePresence mode='wait'>
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
        </AnimatePresence>
      </FamilyButton>
    </div>
  )
})
