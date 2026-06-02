import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { authClient } from '#/lib/auth-client'
import { AccessBanner, ExpiredPage, AuthModal } from '#/components/auth'
import { SITE } from '#/components/landing/data'
import { toast } from 'sonner'

export const Route = createFileRoute('/(app)/app')({
  ssr: true,
  component: AppPage,
})

function AppPage() {
  const { data: accessStatus, isLoading } = useQuery(
    convexQuery(api.users.getAccessStatus, {})
  )

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
          <div className="text-white/50 font-figtree">Chargement de votre session...</div>
        </div>
      </div>
    )
  }

  if (accessStatus?.user && accessStatus.isExpired) {
    return <ExpiredPage />
  }

  return (
    <DashboardContent
      user={accessStatus?.user || null}
      accessStatus={accessStatus || null}
    />
  )
}

function DashboardContent({ user, accessStatus }: { user: any; accessStatus: any }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const triggerDeposit = useConvexMutation(api.users.completeDeposit)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authClient.signOut()
      toast.success('Déconnexion réussie')
      navigate({ to: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleSimulateDeposit = async () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    setSimulating(true)
    try {
      await triggerDeposit()
      toast.success('Dépôt simulé avec succès ! Votre accès de 48h est actif.')
    } catch (error) {
      console.error('Simulation failed:', error)
      toast.error('Erreur lors de la simulation de dépôt')
    } finally {
      setSimulating(false)
    }
  }

  const formatRemainingTime = () => {
    if (!user) return 'Accès non configuré'
    if (!user.hasMadeDeposit) return 'Attente de premier dépôt'
    if (!accessStatus || !accessStatus.remainingMs || accessStatus.remainingMs === Infinity) return ''
    const totalMinutes = Math.floor(accessStatus.remainingMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }

  const creationDate = user
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const expirationDate = user && user.accessExpiresAt
    ? new Date(user.accessExpiresAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen text-white flex flex-col font-figtree relative">
      <AccessBanner />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-kubo font-bold text-2xl tracking-tight text-[#25D366] no-underline">
            {SITE.shortName}
          </Link>
          {user && user.isAdmin && (
            <Link
              to="/admin"
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider px-3 py-1 rounded-full no-underline"
            >
              Admin Panel
            </Link>
          )}
        </div>
        {user ? (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 hover:text-white transition-all text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            Déconnexion
          </button>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:brightness-110 transition-all text-sm font-bold cursor-pointer"
          >
            Connexion / Inscription
          </button>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          // Re-fetch automatically happens via convex query
        }}
      />

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white mb-2">
            Tableau de Bord
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Bienvenue sur votre espace personnel. Gérez votre session et accédez à vos services.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Account Type */}
          <div className="rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Type de Compte</div>
              <div className="text-xl font-bold flex items-center gap-2">
                {!user ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/20" />
                    Non Connecté
                  </>
                ) : user.isAnonymous ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    Accès Temporaire
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#25D366]" />
                    Compte Permanent
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-white/60">
              {!user ? 'Créez un compte pour commencer' : user.isAnonymous ? 'Expire automatiquement après 48h' : 'Accès illimité et sécurisé'}
            </div>
          </div>

          {/* Card 2: Expiration / Status */}
          <div className="rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                {!user ? 'Statut de session' : user.isAnonymous ? 'Temps Restant' : 'Statut de Compte'}
              </div>
              <div className="text-xl font-bold text-orange-400">
                {!user
                  ? 'Indisponible'
                  : user.isAnonymous
                    ? user.hasMadeDeposit
                      ? formatRemainingTime()
                      : 'Attente de dépôt'
                    : 'Actif / Illimité'}
              </div>
            </div>
            <div className="mt-4 text-sm text-white/60">
              {!user
                ? 'Activez vos 48h en vous connectant'
                : user.isAnonymous
                  ? user.hasMadeDeposit
                    ? `Valable jusqu'au ${expirationDate}`
                    : 'Faites un dépôt pour activer vos 48h'
                  : `Créé le ${creationDate}`}
            </div>
          </div>

          {/* Card 3: User Details */}
          <div className="rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Identité</div>
              <div className="text-lg font-bold truncate">
                {!user ? 'Visiteur' : user.name || 'Utilisateur Anonyme'}
              </div>
              <div className="text-sm text-white/50 truncate mt-1">
                {!user ? 'Session publique' : user.email || 'Aucune adresse email'}
              </div>
            </div>
            <div className="mt-4 text-xs text-white/40 font-mono truncate">
              {!user ? 'Non connecté' : `ID: ${user.betterAuthUserId}`}
            </div>
          </div>
        </div>

        {/* Visitor CTA Block */}
        {!user && (
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-3 max-w-lg text-center md:text-left">
              <span className="px-3 py-1 rounded-full text-white/80 text-xs font-bold uppercase tracking-wider">
                Démarrer immédiatement
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Prêt à acquérir vos numéros ?
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                Rejoignez la plateforme en quelques secondes. Choisissez l'accès invité rapide de 48 heures ou créez un compte permanent.
              </p>
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-[14px] font-bold text-neutral-900 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Créer mon accès rapide
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {/* Main CTA Block for Anons */}
        {user && user.isAnonymous && (
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-3 max-w-lg text-center md:text-left">
              <span className="px-3 py-1 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider">
                Sauvegardez vos données
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Sécurisez votre compte maintenant
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">
                {user.hasMadeDeposit ? (
                  <>
                    Votre session temporaire et vos données associées expireront dans{' '}
                    <strong className="text-orange-400 font-bold">{formatRemainingTime()}</strong>. 
                    Convertissez gratuitement votre accès rapide en compte permanent pour ne rien perdre.
                  </>
                ) : (
                  <>
                    Votre session temporaire est active. Convertissez gratuitement votre accès rapide en compte permanent dès maintenant pour conserver vos numéros et historique sans limite de temps.
                  </>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate({ to: '/convert' })}
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-[14px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Passer au compte permanent
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {/* Simuler un Dépôt pour Tester */}
        {(!user || (user.isAnonymous && !user.hasMadeDeposit)) && (
          <div className="rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-white">Simuler un Dépôt</h4>
              <p className="text-white/50 text-xs leading-relaxed max-w-lg">
                {!user ? 'Veuillez vous connecter pour simuler un dépôt sur votre compte.' : 'Activez l\'accès complet de 48 heures et démarrez le compte à rebours de l\'accès temporaire pour tester le flux de recharge.'}
              </p>
            </div>
            <button
              onClick={handleSimulateDeposit}
              disabled={simulating}
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all text-neutral-900 cursor-pointer hover:scale-105 active:scale-95"
            >
              {simulating ? 'Activation...' : !user ? 'Se connecter' : 'Simuler une Recharge'}
            </button>
          </div>
        )}

        {/* Feature Demonstration Area */}
        <div className="rounded-3xl p-8 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Vos Services & Fonctionnalités</h3>
            <p className="text-white/60 text-sm">
              Vous avez accès à l'ensemble des fonctionnalités de num_zer0. Obtenez et gérez vos numéros virtuels instantanément.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 flex items-start gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0">
                <svg className="h-5 w-5 text-[#25D366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Numéros WhatsApp</h4>
                <p className="text-white/50 text-xs leading-relaxed">
                  Obtenez des numéros virtuels dédiés à la vérification et l'activation instantanée de WhatsApp.
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-5 flex items-start gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Réception SMS</h4>
                <p className="text-white/50 text-xs leading-relaxed">
                  Consultez les codes de vérification SMS reçus en temps réel directement sur votre tableau de bord.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
