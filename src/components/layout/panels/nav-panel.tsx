'use client'

import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LogOut, LoaderCircle } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Mon Espace' },
  { path: '/wallet', label: 'Portefeuille' },
  { path: '/account', label: 'Compte' },
  { path: '/wallet', label: 'Recharger' },
  { path: '/support', label: 'Support' },
] as const

export function NavPanel({
  onNavigate,
  isAuthenticated,
}: {
  onNavigate: () => void
  isAuthenticated: boolean
}) {
  const { pathname } = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/'
          },
        },
      })
    } catch (error) {
      console.error('Logout failed', error)
      setIsLoggingOut(false)
    }
  }

  const handleLogin = async () => {
    window.location.href = '/my-space'
  }

  return (
    <div className="flex flex-col gap-[18px] px-5 pt-4 pb-3">
      <div className="flex flex-col w-full gap-2">
        {NAV_ITEMS.map(({ path, label }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')
          return (
            <Link
              key={label}
              to={path}
              onClick={onNavigate}
              className="block bg-transparent w-full no-underline"
            >
              <h3
                className={`font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 ${
                  isActive ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'
                }`}
              >
                {label}
              </h3>
            </Link>
          )
        })}
      </div>
      <div className="border-t border-[var(--line)]/40 pt-3 pb-1" />

      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 bg-transparent w-full no-underline cursor-pointer disabled:opacity-40"
        >
          {isLoggingOut ? (
            <LoaderCircle className="h-5 w-5 shrink-0 text-red-400 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <h3 className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-red-400">
            Log Out
          </h3>
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-transparent w-full no-underline cursor-pointer"
        >
          <svg
            className="h-5 w-5 shrink-0 text-[var(--sea-ink)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <h3 className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-[var(--sea-ink)]">
            Connexion
          </h3>
        </button>
      )}
    </div>
  )
}
