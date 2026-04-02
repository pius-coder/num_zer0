'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

import { Button } from '@/component/ui/button'
import { ClientOnly } from '@/component/ui/client-only'

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
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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
