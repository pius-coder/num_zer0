import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>('analytics')

  // Get current user access status to confirm admin status
  const { data: accessStatus, isLoading: isUserLoading } = useQuery(
    convexQuery(api.users.getAccessStatus, {})
  )

  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    convexQuery(api.analytics.getAnalyticsSummary, {})
  )

  const { data: users, isLoading: isUsersLoading } = useQuery(
    convexQuery(api.users.getAllUsers, {})
  )

  const deleteUser = useConvexMutation(api.users.deleteUser)

  const handleDeleteUser = async (userId: any) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      try {
        await deleteUser({ userId })
        toast.success('Utilisateur supprimé avec succès')
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la suppression')
      }
    }
  }

  const isLoading = isUserLoading || isSummaryLoading || isUsersLoading

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <div className="text-white/50 font-figtree">Chargement du Dashboard Admin...</div>
        </div>
      </div>
    )
  }

  // Redirect if not admin
  if (!accessStatus?.user || !accessStatus.user.isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-white p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Accès Refusé</h2>
        <p className="text-white/60 mb-6 max-w-md">
          Vous n'avez pas les autorisations nécessaires pour accéder à cet espace.
        </p>
        <Link
          to="/app"
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-white no-underline"
        >
          Retour au Tableau de Bord
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-figtree pb-12">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#141414]/50 backdrop-blur-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Admin Mode
          </span>
          <h1 className="text-xl font-bold tracking-tight">num_zer0 Control</h1>
        </div>
        <Link
          to="/app"
          className="text-sm font-semibold text-white/70 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-xl no-underline"
        >
          Retour Application
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-8 mt-8 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 gap-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
              activeTab === 'analytics'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Statistiques & Trafic
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
              activeTab === 'users'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Comptes Utilisateurs ({users?.length || 0})
          </button>
        </div>

        {activeTab === 'analytics' && summary && (
          <div className="flex flex-col gap-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  Visiteurs Uniques
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {summary.totalSessions}
                </div>
                <div className="mt-2 text-xs text-white/40">Sessions actives / totales</div>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  Clics "Acheter"
                </div>
                <div className="text-3xl font-extrabold text-orange-400">
                  {summary.clickBuy}
                </div>
                <div className="mt-2 text-xs text-orange-400/40">Interest to buy CTA</div>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  Clics "Services"
                </div>
                <div className="text-3xl font-extrabold text-blue-400">
                  {summary.clickServices}
                </div>
                <div className="mt-2 text-xs text-blue-400/40">Browsing catalog CTA</div>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  Durée Moyenne
                </div>
                <div className="text-3xl font-extrabold text-[#25D366]">
                  {summary.avgDurationSeconds}s
                </div>
                <div className="mt-2 text-xs text-[#25D366]/40">Visite sur la landing page</div>
              </div>
            </div>

            {/* Graphs / Extra Data Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Devices distribution */}
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col gap-4">
                <h3 className="font-bold text-sm text-white/80 uppercase tracking-wider">
                  Breakdown Appareils
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(summary.deviceCount).map(([device, count]: any) => (
                    <div key={device} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-white/70">
                        <span className="capitalize">{device}</span>
                        <span>{count} events</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full"
                          style={{
                            width: `${(count / summary.totalEvents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(summary.deviceCount).length === 0 && (
                    <p className="text-white/40 text-xs py-4 text-center">
                      Aucune donnée d'appareil enregistrée
                    </p>
                  )}
                </div>
              </div>

              {/* Country stats */}
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col gap-4">
                <h3 className="font-bold text-sm text-white/80 uppercase tracking-wider">
                  Breakdown Pays d'Inscription
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(summary.countryCount).map(([country, count]: any) => (
                    <div key={country} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-white/70">
                        <span>🇨🇲 {country}</span>
                        <span>{count} events</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#25D366] h-full rounded-full"
                          style={{
                            width: `${(count / summary.totalEvents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(summary.countryCount).length === 0 && (
                    <p className="text-white/40 text-xs py-4 text-center">
                      Aucun pays spécifié dans les sessions
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Events logs */}
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col gap-4">
              <h3 className="font-bold text-sm text-white/80 uppercase tracking-wider">
                Journaux d'activités (50 derniers événements)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 uppercase font-semibold">
                      <th className="pb-3 pr-4">Horodatage</th>
                      <th className="pb-3 pr-4">Événement</th>
                      <th className="pb-3 pr-4">Session ID</th>
                      <th className="pb-3 pr-4">Appareil</th>
                      <th className="pb-3 pr-4">Pays</th>
                      <th className="pb-3">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentEvents.map((event: any) => (
                      <tr key={event._id} className="border-b border-white/5 text-white/70 hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-4 font-mono">
                          {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              event.eventType === 'visit'
                                ? 'bg-green-500/10 text-green-400'
                                : event.eventType === 'click_buy'
                                  ? 'bg-orange-500/10 text-orange-400'
                                  : event.eventType === 'click_services'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {event.eventType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-white/40">
                          {event.sessionId}
                        </td>
                        <td className="py-3 pr-4 capitalize text-[10px] text-white/50">
                          {event.device || 'desktop'}
                        </td>
                        <td className="py-3 pr-4 text-[10px]">
                          {event.country ? `🇨🇲 ${event.country}` : '—'}
                        </td>
                        <td className="py-3 font-mono text-[10px] text-white/50">
                          {event.durationMs !== undefined
                            ? `${(event.durationMs / 1000).toFixed(1)}s`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && users && (
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase font-semibold">
                    <th className="pb-3 pr-4">Nom / Email</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Création</th>
                    <th className="pb-3 pr-4">Pays</th>
                    <th className="pb-3 pr-4">Dépôt / Recharge</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u._id} className="border-b border-white/5 text-white/70 hover:bg-white/5 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-white">{u.name || 'Invité anonyme'}</div>
                        <div className="text-white/40 text-[10px] truncate max-w-[200px] mt-0.5">{u.email || 'Pas d\'email'}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.isAnonymous
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-[#25D366]/10 text-[#25D366]'
                          }`}
                        >
                          {u.isAnonymous ? 'Temporaire' : 'Permanent'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-white/50 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 pr-4 text-white/80">
                        {u.country ? `🇨🇲 ${u.country}` : '—'}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.hasMadeDeposit
                              ? 'bg-[#25D366]/10 text-[#25D366]'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {u.hasMadeDeposit ? 'Effectué' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer font-semibold text-[10px] uppercase"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40">
                        Aucun utilisateur enregistré dans la base de données.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
