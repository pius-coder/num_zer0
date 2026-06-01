import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { useAccessTimer } from './hooks/use-access-timer'

export function AccessBanner() {
  const { data: accessStatus } = useQuery(
    convexQuery(api.users.getAccessStatus, {})
  )

  const { remainingMs, urgencyLevel } = useAccessTimer(accessStatus)

  if (!accessStatus?.user?.isAnonymous) return null
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

  const bgColor = {
    safe: 'bg-green-500/10 border-green-500/20 text-green-700',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700',
    critical: 'bg-red-500/10 border-red-500/20 text-red-700',
  }[urgencyLevel]

  const message = {
    safe: 'Votre accès temporaire est actif.',
    warning: 'Votre accès expire bientôt.',
    critical: 'Votre accès expire très bientôt !',
  }[urgencyLevel]

  return (
    <div className={`border-b px-4 py-2 text-center text-sm ${bgColor}`}>
      <span className="font-medium">{message}</span>
      <span className="ml-2">
        Temps restant : <strong>{formatTime(remainingMs)}</strong>
      </span>
    </div>
  )
}
