import { useState, useEffect } from 'react'

type UrgencyLevel = 'safe' | 'warning' | 'critical'

interface AccessTimerResult {
  remainingMs: number
  isExpired: boolean
  urgencyLevel: UrgencyLevel
}

const WARNING_THRESHOLD = 24 * 60 * 60 * 1000
const CRITICAL_THRESHOLD = 2 * 60 * 60 * 1000

export function useAccessTimer(
  accessStatus: {
    isExpired: boolean
    remainingMs: number
  } | undefined
): AccessTimerResult {
  const [remainingMs, setRemainingMs] = useState(
    accessStatus?.remainingMs ?? 0
  )

  useEffect(() => {
    if (!accessStatus || accessStatus.isExpired) {
      setRemainingMs(0)
      return
    }

    setRemainingMs(accessStatus.remainingMs)

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000
        return next > 0 ? next : 0
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [accessStatus?.remainingMs, accessStatus?.isExpired])

  const isExpired = remainingMs <= 0
  const urgencyLevel: UrgencyLevel = isExpired
    ? 'critical'
    : remainingMs < CRITICAL_THRESHOLD
      ? 'critical'
      : remainingMs < WARNING_THRESHOLD
        ? 'warning'
        : 'safe'

  return { remainingMs, isExpired, urgencyLevel }
}
