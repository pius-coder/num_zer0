'use client'

import { Activity, CreditCard, Zap } from 'lucide-react'
import { AdminPageShell } from '../_components/admin-page-shell'
import { useAdminStats } from '@/hooks/use-admin'

interface Metrics {
  purchases: number
  activations: number
  creditVolume: number
}

function KPICard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <div className='rounded-xl border bg-card p-5 transition-colors hover:bg-card/80'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-muted-foreground'>{label}</p>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </div>
      <div className='mt-3'>
        {loading ? (
          <div className='h-8 w-24 animate-pulse rounded bg-muted' />
        ) : (
          <p className='text-2xl font-bold tabular-nums'>{value}</p>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error } = useAdminStats()
  const metrics = data?.metrics as Metrics | undefined

  return (
    <AdminPageShell
      title='Dashboard'
      subtitle='KPI overview for purchases, activations, and credit volume.'
    >
      {isError && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          Failed to load metrics: {(error as Error)?.message}
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <KPICard
          label='Total Purchases'
          value={metrics?.purchases?.toLocaleString() ?? '—'}
          icon={CreditCard}
          loading={isLoading}
        />
        <KPICard
          label='Total Activations'
          value={metrics?.activations?.toLocaleString() ?? '—'}
          icon={Activity}
          loading={isLoading}
        />
        <KPICard
          label='Credit Volume'
          value={metrics?.creditVolume?.toLocaleString() ?? '—'}
          icon={Zap}
          loading={isLoading}
        />
      </div>
    </AdminPageShell>
  )
}
