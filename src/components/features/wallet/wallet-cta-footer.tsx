'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useRechargeDrawer } from '@/components/features/recharge'

interface WalletCtaFooterProps {
  locale: string
}

export function WalletCtaFooter({ locale }: WalletCtaFooterProps) {
  const { openRecharge } = useRechargeDrawer()

  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      <Button onClick={() => openRecharge()}>Recharger des crédits</Button>
      <Button variant='outline' render={<Link href={`/${locale}/my-space`} />}>
        Parcourir les services
      </Button>
    </div>
  )
}

