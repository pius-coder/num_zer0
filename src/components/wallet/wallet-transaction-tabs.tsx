'use client'

import { memo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '#/common/ui/tabs'

type TransactionTab = 'all' | 'purchase' | 'numbers'

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
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">Tout</TabsTrigger>
        <TabsTrigger value="purchase">Recharges</TabsTrigger>
        <TabsTrigger value="numbers">Achats numéros</TabsTrigger>
      </TabsList>
    </Tabs>
  )
})
