import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '../../../convex/_generated/api'
import { useAccessTimer } from './hooks/use-access-timer'

export function AccessBanner() {
  const { data: accessStatus } = useQuery(
    convexQuery(api.users.getAccessStatus, {})
  )

  const { remainingMs, urgencyLevel } = useAccessTimer(accessStatus)

  if (!accessStatus?.user?.isAnonymous) return null

  // Case 1: Guest User who hasn't made a deposit yet
  if (!accessStatus.user.hasMadeDeposit) {
    return (
      <div className="w-full border-b border-white/5 bg-[#141414]/80 backdrop-blur-md px-6 py-2 flex items-center justify-center text-xs text-white/50 tracking-wide font-medium">
        <span>Compte Invité</span>
      </div>
    )
  }

  // Case 2: Guest User who has paid - access timer starts ticking!
  if (accessStatus.isExpired) return null

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}j ${remainingHours}h`
    }
    return `${hours}h ${minutes}m`
  }

  const formattedTime = formatTime(remainingMs)

  // Configure copy and style according to urgency level
  const bannerConfig = {
    safe: {
      text: `Accès temporaire — il vous reste ${formattedTime}. Créez un compte permanent pour un accès illimité.`,
      cta: 'Passer au compte permanent',
      style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25',
    },
    warning: {
      text: 'Moins de 24h restantes sur votre accès temporaire. Ne perdez pas vos paiements — créez votre compte maintenant.',
      cta: 'Sécuriser mon compte',
      style: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/25',
    },
    critical: {
      text: 'Votre accès expire bientôt. Créez un compte permanent pour conserver votre historique et continuer à profiter du service.',
      cta: 'Créer mon compte maintenant',
      style: 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/25',
    },
  }[urgencyLevel]

  return (
    <div className={`w-full border-b backdrop-blur-md px-6 py-3 flex flex-col md:flex-row items-center justify-center gap-3 text-sm transition-all duration-300 ${bannerConfig.style.split(' hover:')[0]}`}>
      <span className="font-semibold text-center leading-relaxed">
        {bannerConfig.text}
      </span>
      <Link
        to="/convert"
        className={`shrink-0 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-current no-underline hover:scale-105 active:scale-95 ${bannerConfig.style}`}
      >
        {bannerConfig.cta}
        <svg className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
