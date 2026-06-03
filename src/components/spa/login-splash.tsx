'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { LogoApp } from '@/components/layout/logo-app'
import { useAuthSplashStore } from './auth-splash-store'
import {
  generateIdentifier,
  signUpAsGuest,
  signInAsGuest,
} from '#/common/guest-identifier'

type Tab = 'user' | 'guest'
type AuthMode = 'login' | 'signup'
type GuestStep = 'generate' | 'created'

export function LoginSplash() {
  const [tab, setTab] = useState<Tab>('user')

  // User tab
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [userError, setUserError] = useState<string | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const { register, handleSubmit: formSubmit, reset } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  })

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setUserError(null)
    reset()
  }

  // Guest tab
  const [guestStep, setGuestStep] = useState<GuestStep>('generate')
  const [guestIdentifier, setGuestIdentifier] = useState('')
  const [guestError, setGuestError] = useState<string | null>(null)
  const [guestLoading, setGuestLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reconnectValue, setReconnectValue] = useState('')

  const navigate = useNavigate()
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const close = useAuthSplashStore((s) => s.close)

  // ── User tab ──────────────────────────────────────────────

  const handleUserSubmit = async (data: { name?: string; email: string; password: string }) => {
    setUserLoading(true)
    setUserError(null)
    try {
      if (authMode === 'signup') {
        const response = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name ?? 'Utilisateur',
        })
        if (response?.error) {
          setUserError(response.error.message || "Erreur lors de l'inscription")
          setUserLoading(false)
          return
        }
      } else {
        const response = await authClient.signIn.email({
          email: data.email,
          password: data.password,
        })
        if (response?.error) {
          setUserError(response.error.message || 'Identifiants incorrects')
          setUserLoading(false)
          return
        }
      }
      setUserLoading(false)
      close()
      navigate({ to: '/my-space' })
    } catch (err) {
      console.error('handleUserSubmit failed:', err)
      setUserError('Une erreur inattendue est survenue')
      setUserLoading(false)
    }
  }

  // ── Guest tab ─────────────────────────────────────────────

  const handleGenerate = () => {
    setGuestIdentifier(generateIdentifier())
    setGuestStep('created')
  }

  const handleCreateGuest = async () => {
    setGuestLoading(true)
    setGuestError(null)
    try {
      const result = await signUpAsGuest(guestIdentifier)
      if (result.error) {
        setGuestError(result.error)
        setGuestLoading(false)
        return
      }
      setGuestLoading(false)
      close()
      navigate({ to: '/my-space' })
    } catch (err) {
      console.error('handleCreateGuest failed:', err)
      setGuestError('Une erreur inattendue est survenue')
      setGuestLoading(false)
    }
  }

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(guestIdentifier)
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Échec de la copie dans le presse-papiers:', err)
    }
  }

  const handleReconnect = async () => {
    const id = reconnectValue.trim()
    if (!id) return
    setGuestLoading(true)
    setGuestError(null)
    try {
      const result = await signInAsGuest(id)
      if (result.error) {
        setGuestError(result.error)
        setGuestLoading(false)
        return
      }
      setGuestLoading(false)
      close()
      navigate({ to: '/my-space' })
    } catch (err) {
      console.error('handleReconnect failed:', err)
      setGuestError('Une erreur inattendue est survenue')
      setGuestLoading(false)
    }
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setUserError(null)
    setGuestError(null)
    setGuestStep('generate')
    setGuestIdentifier('')
    setReconnectValue('')
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 text-center">
      <LogoApp className="text-8xl md:text-9xl mb-6" />

      {/* Tabs */}
      <div className="flex border-b border-[var(--line)]/40 mb-8 w-full max-w-xs">
        <button
          onClick={() => switchTab('user')}
          className={`flex-1 pb-3 text-center font-figtree text-[15px] font-semibold border-b-2 transition-all cursor-pointer bg-transparent ${
            tab === 'user'
              ? 'border-[#25D366] text-[var(--sea-ink)]'
              : 'border-transparent text-[var(--sea-ink-soft)]/60 hover:text-[var(--sea-ink)]'
          }`}
        >
          Utilisateur
        </button>
        <button
          onClick={() => switchTab('guest')}
          className={`flex-1 pb-3 text-center font-figtree text-[15px] font-semibold border-b-2 transition-all cursor-pointer bg-transparent ${
            tab === 'guest'
              ? 'border-[#25D366] text-[var(--sea-ink)]'
              : 'border-transparent text-[var(--sea-ink-soft)]/60 hover:text-[var(--sea-ink)]'
          }`}
        >
          Invité
        </button>
      </div>

      {/* ─── User tab content ─── */}
      {tab === 'user' ? (
        <>
          <h1 className="font-figtree text-[var(--sea-ink)] text-[24px] font-medium tracking-[-0.04em] leading-[1.25] mb-2">
            {authMode === 'login' ? 'Bon retour' : 'Créer un compte'}
          </h1>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[13px] font-semibold mb-6 max-w-sm">
            {authMode === 'login'
              ? 'Connectez-vous à votre compte'
              : 'Inscrivez-vous pour accéder à tous les services'}
          </p>

          <form onSubmit={formSubmit(handleUserSubmit)} className="w-full max-w-xs space-y-3">
            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Nom complet"
                required
                {...register('name', { required: authMode === 'signup' })}
                className="w-full font-figtree text-[15px] px-4 py-3 rounded-xl border border-[var(--line)]/40 bg-transparent text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/40 focus:border-[#25D366] focus:outline-none transition-all"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              required
              {...register('email', { required: true })}
              className="w-full font-figtree text-[15px] px-4 py-3 rounded-xl border border-[var(--line)]/40 bg-transparent text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/40 focus:border-[#25D366] focus:outline-none transition-all"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              required
              minLength={8}
              {...register('password', { required: true, minLength: 8 })}
              className="w-full font-figtree text-[15px] px-4 py-3 rounded-xl border border-[var(--line)]/40 bg-transparent text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/40 focus:border-[#25D366] focus:outline-none transition-all"
            />

            {userError && (
              <p className="font-figtree text-red-500 text-[13px] font-semibold">{userError}</p>
            )}

            <button
              type="submit"
              disabled={userLoading}
              className="w-full font-figtree text-[18px] font-medium tracking-[-0.04em] py-3 rounded-xl bg-[#25D366] text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-40"
            >
              {userLoading
                ? 'Chargement…'
                : authMode === 'login'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={() => switchAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="font-figtree text-[var(--sea-ink-soft)] text-[13px] font-semibold underline underline-offset-2 hover:text-[var(--sea-ink)] transition-all cursor-pointer bg-transparent border-none"
            >
              {authMode === 'login'
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </>
      ) : (
        /* ─── Guest tab content ─── */
        <>
          {guestStep === 'generate' ? (
            <>
              <h1 className="font-figtree text-[var(--sea-ink)] text-[24px] font-medium tracking-[-0.04em] leading-[1.25] mb-2">
                Accès invité
              </h1>
              <p className="font-figtree text-[var(--sea-ink-soft)] text-[13px] font-semibold mb-8 max-w-sm leading-relaxed">
                Un identifiant unique sera généré. Conservez-le pour récupérer votre
                accès sur un autre appareil.
              </p>
              <button
                onClick={handleGenerate}
                className="w-full max-w-xs font-figtree text-[18px] font-medium tracking-[-0.04em] py-3 rounded-xl bg-[#25D366] text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                Générer mon identifiant
              </button>
            </>
          ) : (
            <>
              <h1 className="font-figtree text-[var(--sea-ink)] text-[24px] font-medium tracking-[-0.04em] leading-[1.25] mb-1">
                Votre identifiant
              </h1>
              <p className="font-figtree text-[var(--sea-ink-soft)] text-[13px] font-semibold mb-6 max-w-sm leading-relaxed">
                Gardez-le précieusement. Vous en aurez besoin pour vous reconnecter.
              </p>

              <div className="w-full max-w-xs mb-6 p-4 rounded-xl border border-amber-200/60 bg-amber-50/50">
                <p className="font-figtree text-amber-700 text-[13px] font-semibold uppercase tracking-wider mb-3">
                  ⚠️ Identifiant à conserver
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-[var(--sea-ink)] text-[16px] font-medium bg-white/60 rounded-lg px-3 py-2 truncate select-all">
                    {guestIdentifier}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="shrink-0 font-figtree text-[var(--sea-ink)] text-[15px] font-semibold uppercase tracking-wider px-3 py-2 rounded-lg border border-[var(--line)]/40 hover:bg-[var(--sea-ink)]/5 active:scale-[0.98] cursor-pointer transition-all"
                  >
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreateGuest}
                disabled={guestLoading}
                className="w-full max-w-xs font-figtree text-[18px] font-medium tracking-[-0.04em] py-3 rounded-xl bg-[#25D366] text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                {guestLoading ? 'Création…' : 'Créer et accéder'}
              </button>
            </>
          )}

          {guestError && (
            <p className="font-figtree text-red-500 text-[13px] font-semibold mt-4">
              {guestError}
            </p>
          )}

          {/* Reconnect */}
          <div className="border-t border-[var(--line)]/40 w-full max-w-xs mt-8 pt-6">
            <p className="font-figtree text-[var(--sea-ink-soft)] text-[13px] font-semibold uppercase tracking-wider mb-3">
              Déjà un identifiant ?
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await handleReconnect()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="lune.x7k9"
                value={reconnectValue}
                onChange={(e) => setReconnectValue(e.target.value)}
                className="flex-1 font-figtree text-[15px] px-4 py-3 rounded-xl border border-[var(--line)]/40 bg-transparent text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/40 focus:border-[#25D366] focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={guestLoading || !reconnectValue.trim()}
                className="font-figtree text-[15px] font-semibold px-4 py-3 rounded-xl bg-[var(--sea-ink)] text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                OK
              </button>
            </form>
          </div>
        </>
      )}

      <button
        onClick={() => {
          close()
          navigate({ to: '/' })
        }}
        className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold transition-all hover:text-[var(--sea-ink)] cursor-pointer bg-transparent border-none mt-6"
      >
        Fermer
      </button>
    </div>
  )
}
