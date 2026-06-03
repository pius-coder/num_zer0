/**
 * Global loading state — simple pub/sub store.
 * No external deps, works with SSR, no Vite optimization issues.
 *
 * The store itself has zero React imports. Components consume it
 * via the custom hook in ../hooks/use-global-loading.ts.
 */

export type LoadingState = {
  isLoading: boolean
  message?: string
}

type Listener = () => void

// Internal state
let state: LoadingState = { isLoading: false }
const listeners = new Set<Listener>()

// Core store
export const loadingStore = {
  getState: () => state,
  setState: (partial: Partial<LoadingState>) => {
    state = { ...state, ...partial }
    listeners.forEach((l) => l())
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  reset: () => {
    state = { isLoading: false }
    listeners.forEach((l) => l())
  },
}
