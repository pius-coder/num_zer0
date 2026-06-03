import { ConvexClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.warn('VITE_CONVEX_URL is not defined. Tracking disabled.')
}

const client = CONVEX_URL ? new ConvexClient(CONVEX_URL) : null

// Get or create session ID in sessionStorage
const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('numzero_session_id')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('numzero_session_id', id)
  }
  return id
}

// Detect device type
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

const sessionStartTime = typeof window !== 'undefined' ? Date.now() : 0
let isInitialized = false

export const trackers = {
  init() {
    if (typeof window === 'undefined' || isInitialized || !client) return
    isInitialized = true

    const sessionId = getSessionId()
    const device = getDeviceType()

    // Track visit
    client.mutation(api.analytics.trackEvent, {
      eventType: 'visit',
      sessionId,
      device,
    })

    // Track page leave
    const trackLeave = () => {
      const durationMs = Date.now() - sessionStartTime
      client.mutation(api.analytics.trackEvent, {
        eventType: 'page_leave',
        sessionId,
        device,
        durationMs,
      })
    }

    // Capture leave on page hide or unload
    window.addEventListener('pagehide', trackLeave)
    window.addEventListener('beforeunload', trackLeave)
  },

  trackClick(eventType: 'click_buy' | 'click_services' | string) {
    if (!client) return
    const sessionId = getSessionId()
    const device = getDeviceType()

    client.mutation(api.analytics.trackEvent, {
      eventType,
      sessionId,
      device,
    })
  },
}
