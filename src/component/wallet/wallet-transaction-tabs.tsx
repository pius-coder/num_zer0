'use client'

import { memo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/component/ui/tabs'

type TransactionTab = 'all' | 'credit' | 'numbers'

interface WalletTransactionTabsProps {
  value: TransactionTab
  onChange: (tab: TransactionTab) => void
}

export const WalletTransactionTabs = memo(function WalletTransactionTabs({
  value,
  onChange,
}: WalletTransactionTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TransactionTab)}>
      <TabsList className='grid w-full grid-cols-3'>
        <TabsTrigger value='all'>Tout</TabsTrigger>
        <TabsTrigger value='credit'>Achats crédits</TabsTrigger>
        <TabsTrigger value='numbers'>Achats numéros</TabsTrigger>
      </TabsList>
    </Tabs>
  )
})
