import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

interface RouteLoaderProps {
  /** Identifiant du caller pour debug (ex: "__root.tsx") */
  caller?: string
  /** Délai avant d'afficher le loader (defaut: 1500ms) */
  delay?: number
}

export function RouteLoader({ caller, delay = 1500 }: RouteLoaderProps) {
  const isRouterPending = useRouterState({ select: (s) => s.status === 'pending' })
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    if (isRouterPending) {
      const timer = setTimeout(() => {
        setShowLoader(true)
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[RouteLoader] Route pending >${delay}ms (path: ${globalThis.location?.pathname ?? '?'}, caller: ${caller ?? 'unknown'})`,
          )
        }
      }, delay)
      return () => clearTimeout(timer)
    }

    setShowLoader(false)
  }, [isRouterPending, delay, caller])

  if (!showLoader) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-1 overflow-hidden"
      role="progressbar"
      aria-label="Chargement de la page"
    >
      <div className="h-full w-full bg-[var(--lagoon)] animate-[loader_2s_ease-in-out_infinite]" />
    </div>
  )
}
