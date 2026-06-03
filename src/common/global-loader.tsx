import { useSyncExternalStore } from 'react'
import { loadingStore } from '#/common/stores/loading.store'
import { Spinner } from '#/common/spinner'

export function GlobalLoader() {
  const globalLoading = useSyncExternalStore(
    loadingStore.subscribe,
    () => {
      const s = loadingStore.getState()
      return s.isLoading
    },
    () => false,
  )

  const message = useSyncExternalStore(
    loadingStore.subscribe,
    () => loadingStore.getState().message,
    () => undefined as string | undefined,
  )

  if (!globalLoading) return null

  return <Spinner message={message} position="top" />
}
