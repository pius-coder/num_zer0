'use client'

import { Coins, Wallet } from 'lucide-react'

import { RechargeTriggerButton } from '@/components/features/recharge'

interface WalletBalanceCardProps {
  balance: {
    base: number
    bonus: number
    promotional: number
    total: number
  } | null
  loading?: boolean
}

export function WalletBalanceCard({ balance, loading }: WalletBalanceCardProps) {
  return (
    <div className='space-y-3'>
      <div className='text-sm font-semibold text-zinc-100 flex items-center gap-2 px-1'>
        <Wallet className='h-4 w-4' />
        Solde Wallet
      </div>
      <div className='p-1'>
        {loading ? (
          <p className='text-sm text-muted-foreground'>Chargement du solde...</p>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-3xl font-bold tracking-tight text-zinc-100'>{balance?.total ?? 0}</p>
                <p className='text-xs text-zinc-500'>credits disponibles</p>
              </div>
              <RechargeTriggerButton  credits={balance?.total ?? 0} />
            </div>
            <div className='grid grid-cols-3 gap-2 text-xs'>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-zinc-500'>Base</p>
                <p className='font-semibold text-zinc-100'>{balance?.base ?? 0}</p>
              </div>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-zinc-500'>Bonus</p>
                <p className='font-semibold text-zinc-100'>{balance?.bonus ?? 0}</p>
              </div>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-zinc-500'>Promo</p>
                <p className='font-semibold text-zinc-100'>{balance?.promotional ?? 0}</p>
              </div>
            </div>
            <div className='text-xs text-zinc-500 flex items-center gap-1.5'>
              <Coins className='h-3.5 w-3.5' />
              Le bouton + ouvre le drawer global de recharge.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

