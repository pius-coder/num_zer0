'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type PanelId = 'nav' | 'recharge' | 'topup' | 'details' | null

interface BottomNavContextValue {
  isOpen: boolean
  activePanel: PanelId
  panelProps: Record<string, unknown>
  openPanel: (panel: PanelId, props?: Record<string, unknown>) => void
  closePanel: () => void
  toggleNav: () => void
}

const BottomNavContext = createContext<BottomNavContextValue | null>(null)

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [panelProps, setPanelProps] = useState<Record<string, unknown>>({})

  const openPanel = useCallback((panel: PanelId, props?: Record<string, unknown>) => {
    setActivePanel(panel)
    setPanelProps(props ?? {})
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    setActivePanel(null)
    setPanelProps({})
  }, [])

  const toggleNav = useCallback(() => {
    openPanel('nav')
  }, [openPanel])

  return (
    <BottomNavContext.Provider
      value={{ isOpen, activePanel, panelProps, openPanel, closePanel, toggleNav }}
    >
      {children}
    </BottomNavContext.Provider>
  )
}

export function useBottomNav() {
  const ctx = useContext(BottomNavContext)
  if (!ctx) throw new Error('useBottomNav must be used within BottomNavProvider')
  return ctx
}
