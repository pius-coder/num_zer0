import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Spinner } from '#/common/spinner'

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

  return <Spinner position="top" />
}
