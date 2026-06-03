import { useCallback, useSyncExternalStore, useRef } from 'react'
import { loadingStore } from '../stores/loading.store'

const SSR_GET_SNAPSHOT = () => false
const SSR_GET_MESSAGE = () => undefined

/**
 * Hook into global loading state.
 *
 * Returns `{ isLoading, message, startLoading, stopLoading }`.
 *
 * `startLoading(msg?, timeoutMs?)` shows the loader with an optional
 * message and auto-clear timeout.  `stopLoading()` hides it immediately.
 */
export function useGlobalLoading() {
  const isLoading = useSyncExternalStore(
    loadingStore.subscribe,
    () => loadingStore.getState().isLoading,
    SSR_GET_SNAPSHOT,
  )

  const message = useSyncExternalStore(
    loadingStore.subscribe,
    () => loadingStore.getState().message,
    SSR_GET_MESSAGE,
  )

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const startLoading = useCallback((msg?: string, timeoutMs?: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    loadingStore.setState({ isLoading: true, message: msg })
    if (timeoutMs) {
      timeoutRef.current = setTimeout(() => {
        loadingStore.setState({ isLoading: false })
        timeoutRef.current = undefined
      }, timeoutMs)
    }
  }, [])

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    loadingStore.setState({ isLoading: false })
  }, [])

  return { isLoading, message, startLoading, stopLoading }
}

/**
 * Imperative API — use outside React components (e.g., router events).
 */
export const loadingApi = {
  start: (message?: string) => loadingStore.setState({ isLoading: true, message }),
  stop: () => loadingStore.setState({ isLoading: false }),
  get: () => loadingStore.getState(),
}
