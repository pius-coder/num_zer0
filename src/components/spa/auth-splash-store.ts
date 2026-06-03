'use client'

import { useSyncExternalStore, useCallback } from 'react'

interface AuthSplashState {
  showLogin: boolean
  open: () => void
  close: () => void
}

// Internal state
let showLogin = true
const listeners = new Set<() => void>()

// Cached snapshot — updated only when showLogin actually changes
let cachedSnapshot: AuthSplashState = {
  showLogin: true,
  open: () => {},
  close: () => {},
}

const notify = () => {
  listeners.forEach((l) => l())
}

const open = () => {
  if (showLogin) return // no-op if already open
  showLogin = true
  updateCached()
  notify()
}

const close = () => {
  if (!showLogin) return // no-op if already closed
  showLogin = false
  updateCached()
  notify()
}

function updateCached() {
  cachedSnapshot = { showLogin, open, close }
}

// Initialize cached snapshot with real functions
cachedSnapshot = { showLogin, open, close }

function getSnapshot(): AuthSplashState {
  return cachedSnapshot
}

const SSR_SNAPSHOT: AuthSplashState = { showLogin: true, open, close }

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function useAuthSplashStore<U>(selector: (state: AuthSplashState) => U): U {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SSR_SNAPSHOT)
  return selector(state)
}

export function useAuthSplashClose() {
  return useAuthSplashStore(useCallback((s: AuthSplashState) => s.close, []))
}
