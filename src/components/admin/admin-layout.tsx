import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { Link } from '@tanstack/react-router'
import { AdminSidebar } from './admin-sidebar'
import { AdminAnalytics } from './analytics/admin-analytics'
import { AdminUsers } from './users/admin-users'
import { AdminPurchases } from './purchases/admin-purchases'
import { AdminActivations } from './activations/admin-activations'
import { AdminAccounting } from './accounting/admin-accounting'
import { AdminPromoCodes } from './promo-codes/admin-promo-codes'
import { AdminMargins } from './margins/admin-margins'
import { AdminPackages } from './packages/admin-packages'
import { AdminWallets } from './wallets/admin-wallets'
import { AdminPaymentIntents } from './payment-intents/admin-payment-intents'
import { AdminOrders } from './orders/admin-orders'
import { AdminLedger } from './ledger/admin-ledger'

type TabId =
  | 'analytics'
  | 'users'
  | 'purchases'
  | 'activations'
  | 'accounting'
  | 'promo-codes'
  | 'margins'
  | 'packages'
  | 'wallets'
  | 'payment-intents'
  | 'orders'
  | 'ledger'

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('analytics')

  const { data: accessStatus, isLoading: isUserLoading } = useQuery(
    convexQuery(api.users.getAccessStatus, {}),
  )

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
          <div className="text-[var(--sea-ink-soft)] font-figtree">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!accessStatus?.user || !accessStatus.user.isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-figtree text-2xl font-bold text-red-500 mb-2">Accès Refusé</h2>
        <p className="text-[var(--sea-ink-soft)] mb-6 max-w-md font-figtree">
          Vous n'avez pas les autorisations nécessaires pour accéder à cet espace.
        </p>
        <Link
          to="/my-space"
          className="px-6 py-3 rounded-xl bg-[#F97316] text-white font-bold font-figtree no-underline hover:brightness-110 transition-all anim-glow-pulse"
        >
          Retour à l'Application
        </Link>
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'analytics':
        return <AdminAnalytics />
      case 'users':
        return <AdminUsers />
      case 'purchases':
        return <AdminPurchases />
      case 'activations':
        return <AdminActivations />
      case 'accounting':
        return <AdminAccounting />
      case 'promo-codes':
        return <AdminPromoCodes />
      case 'margins':
        return <AdminMargins />
      case 'packages':
        return <AdminPackages />
      case 'wallets':
        return <AdminWallets />
      case 'payment-intents':
        return <AdminPaymentIntents />
      case 'orders':
        return <AdminOrders />
      case 'ledger':
        return <AdminLedger />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--sea-ink)] font-figtree flex">
      <AdminSidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabId)} />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-figtree text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'users' && 'Utilisateurs'}
              {activeTab === 'purchases' && 'Achats'}
              {activeTab === 'activations' && 'Activations SMS'}
              {activeTab === 'accounting' && 'Comptabilité'}
              {activeTab === 'promo-codes' && 'Codes Promo'}
              {activeTab === 'margins' && 'Marges SMS'}
              {activeTab === 'packages' && 'Packages'}
              {activeTab === 'wallets' && 'Portefeuilles'}
              {activeTab === 'payment-intents' && 'Paiements'}
              {activeTab === 'orders' && 'Commandes'}
              {activeTab === 'ledger' && 'Grand Livre'}
            </h1>
            <p className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mt-1">
              Panneau d'administration
            </p>
          </div>
          <span className="font-figtree text-[13px] font-semibold uppercase tracking-wider text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-full">
            Admin Mode
          </span>
        </header>

        <div className="space-y-6">{renderTab()}</div>
      </main>
    </div>
  )
}
