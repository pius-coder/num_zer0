import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'

export function AccountTypeChooser() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleQuickAccess = async () => {
    setLoading(true)
    try {
      await authClient.signIn.anonymous()
      navigate({ to: '/app' })
    } catch (error) {
      console.error('Quick access failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermanent = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choisissez votre type de compte</h2>
        <p className="mt-2 text-muted-foreground">
          Accédez rapidement ou créez un compte permanent
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          onClick={handlePermanent}
          className="flex flex-col items-center gap-4 rounded-xl border p-8 transition-colors hover:bg-accent"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Compte permanent</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez un compte avec email et mot de passe
            </p>
          </div>
        </button>

        <button
          onClick={handleQuickAccess}
          disabled={loading}
          className="flex flex-col items-center gap-4 rounded-xl border p-8 transition-colors hover:bg-accent"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <svg
              className="h-8 w-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Accès rapide 48h</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Accès temporaire sans inscription
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
