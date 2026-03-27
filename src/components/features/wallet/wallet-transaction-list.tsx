'use client'

import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActivations } from '@/hooks/use-activations'
import { useTransactions } from '@/hooks/use-credits'

type WalletTx = {
  id: string
  label: string
  date: string
  amountCredits: number
  kind: 'credit_purchase' | 'number_purchase'
  status?: string
}

export function WalletTransactionList() {
  const [tab, setTab] = useState<'all' | 'credit' | 'numbers'>('all')

  const { data: activationsData, isLoading: isLoadingActivations } = useActivations()
  const { data: purchasesData, isLoading: isLoadingPurchases } = useTransactions()

  const itemsRaw = useMemo(() => {
    const activationRows = (activationsData?.activations ?? []).map((row: any) => ({
      id: row.id,
      label: `Achat numéro - ${row.serviceCode ?? 'Service'}`,
      date: row.createdAt ?? new Date().toISOString(),
      amountCredits: Number(row.quotedCredits ?? 0),
      kind: 'number_purchase' as const,
      status: row.state,
    }))

    const purchaseRows = (purchasesData?.transactions ?? []).map((row: any) => ({
      id: row.id,
      label: row.description || (row.type === 'adjustment' ? 'Ajustement manuel' : 'Achat crédits'),
      date: row.createdAt ?? new Date().toISOString(),
      amountCredits: Number(row.amount ?? 0),
      kind: 'credit_purchase' as const,
      status: row.type,
    }))

    const combined = [...purchaseRows, ...activationRows]
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [activationsData, purchasesData])

  const items = useMemo(() => {
    if (tab === 'all') return itemsRaw
    if (tab === 'credit') return itemsRaw.filter((tx) => tx.kind === 'credit_purchase')
    return itemsRaw.filter((tx) => tx.kind === 'number_purchase')
  }, [itemsRaw, tab])

  const isLoading = isLoadingActivations || isLoadingPurchases

  return (
    <div className='space-y-3'>
      <div className='space-y-3'>
        <h2 className='text-base font-semibold'>Historique transactions</h2>
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='all'>Tout</TabsTrigger>
            <TabsTrigger value='credit'>Achats crédits</TabsTrigger>
            <TabsTrigger value='numbers'>Achats numéros</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className='space-y-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Aucune transaction pour ce filtre.</p>
        ) : (
          items.map((tx) => {
            const isCredit = tx.kind === 'credit_purchase'
            return (
              <div key={tx.id} className='rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.03]'>
                <div className='min-w-0'>
                  <p className='text-sm font-medium truncate'>{tx.label}</p>
                  <p className='text-xs text-muted-foreground'>
                    {new Date(tx.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className='text-right'>
                  <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {isCredit ? '+' : '-'}
                    {tx.amountCredits} cr
                  </p>
                  <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                    {isCredit ? <ArrowDownCircle className='h-3.5 w-3.5' /> : <ArrowUpCircle className='h-3.5 w-3.5' />}
                    {isCredit ? 'Recharge' : 'Numéro'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

