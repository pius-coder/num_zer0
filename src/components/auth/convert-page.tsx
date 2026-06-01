import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { authClient } from '#/lib/auth-client'

export function ConvertPage() {
  const navigate = useNavigate()
  const convertToPermanent = useConvexMutation(api.users.convertToPermanent)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      })

      if (signUpError) {
        setError(signUpError.message || 'Erreur lors de la création du compte')
        return
      }

      await convertToPermanent({ email, name })
      navigate({ to: '/app' })
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">Finalisez votre compte</h1>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
            En quelques secondes, sécurisez votre accès et retrouvez tout votre historique sur un compte permanent, sans limite de durée.
          </p>
          <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
            ✨ Vos paiements effectués avec votre accès temporaire seront automatiquement transférés sur votre nouveau compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Nom
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 rounded-[14px] px-5 py-3.5 text-base font-bold text-neutral-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-[#25D366] !bg-[#25D366] border-none shadow-lg shadow-[#25D366]/20"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <button
          onClick={() => navigate({ to: '/' })}
          className="w-full flex justify-center items-center h-auto py-2.5 rounded-[14px] bg-transparent hover:bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all text-sm font-semibold cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
