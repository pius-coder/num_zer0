'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

import { Button } from '@/common/ui/button'
import { ClientOnly } from '@/common/ui/client-only'

function useThemeState() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const stored = root.getAttribute('data-theme') || 'auto'
    const isDarkMode = stored === 'dark' || (stored === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)

    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme') || 'auto'
      setIsDark(current === 'dark' || (current === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const setTheme = (theme: string) => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
  }

  return { isDark, setTheme }
}

export function ThemeSwitcher() {
  return (
    <ClientOnly
      fallback={
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 rounded-full'
          aria-label='Switch theme'
        >
          <Moon className='h-4 w-4 text-muted-foreground' />
        </Button>
      }
    >
      <ThemeToggleButton />
    </ClientOnly>
  )
}

function ThemeToggleButton() {
  const { isDark, setTheme } = useThemeState()

  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-8 w-8 rounded-full'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className='h-4 w-4 text-muted-foreground' />
      ) : (
        <Moon className='h-4 w-4 text-muted-foreground' />
      )}
    </Button>
  )
}
