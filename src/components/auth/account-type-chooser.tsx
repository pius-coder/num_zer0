import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { authClient } from '#/lib/auth-client'
import { toast } from 'sonner'

interface AccountTypeChooserProps {
  onClose?: () => void
}

export function AccountTypeChooser({ onClose }: AccountTypeChooserProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Tabs: 'temporary' | 'permanent'
  const [activeTab, setActiveTab] = useState<'temporary' | 'permanent'>('temporary')
  
  // For permanent account: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  
  const [error, setError] = useState('')

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const handleQuickAccess = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await authClient.signIn.anonymous()
      if (response?.error) {
        setError(response.error.message || 'La connexion anonyme a échoué')
        toast.error(response.error.message || 'Échec de la connexion temporaire')
        return
      }
      toast.success('Accès temporaire de 48 heures activé !')
      if (onClose) onClose()
      navigate({ to: '/my-space' })
    } catch (err: any) {
      console.error('Quick access failed:', err)
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handlePermanentSubmit = async (data: any) => {
    setLoading(true)
    setError('')

    try {
      if (authMode === 'signup') {
        const response = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name: data.name,
        })
        if (response?.error) {
          setError(response.error.message || "Erreur lors de l'inscription")
          toast.error(response.error.message || 'Erreur lors de la création du compte')
          return
        }
        toast.success('Compte créé avec succès !')
      } else {
        const response = await authClient.signIn.email({
          email: data.email,
          password: data.password,
        })
        if (response?.error) {
          setError(response.error.message || 'Identifiants incorrects')
          toast.error(response.error.message || 'Erreur de connexion')
          return
        }
        toast.success('Connexion réussie !')
      }
      
      if (onClose) onClose()
      navigate({ to: '/my-space' })
    } catch (err: any) {
      console.error('Auth operation failed:', err)
      setError('Une erreur est survenue lors de l’authentification')
    } finally {
      setLoading(false)
    }
  }

  const switchAuthMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setError('')
    reset()
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all text-white">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer border-none bg-transparent"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => { setActiveTab('temporary'); setError('') }}
          className={`flex-1 pb-2 text-center text-sm font-semibold border-b-2 bg-transparent transition-all cursor-pointer ${
            activeTab === 'temporary' ? 'border-[#25D366] text-[#25D366]' : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          Accès Rapide (48h)
        </button>
        <button
          onClick={() => { setActiveTab('permanent'); setError('') }}
          className={`flex-1 pb-2 text-center text-sm font-semibold border-b-2 bg-transparent transition-all cursor-pointer ${
            activeTab === 'permanent' ? 'border-[#25D366] text-[#25D366]' : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          Compte Permanent
        </button>
      </div>

      {activeTab === 'temporary' ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="text-center max-w-sm">
            <h3 className="text-lg font-bold">Profitez d'un accès rapide</h3>
            <p className="mt-2 text-sm text-white/75 leading-relaxed font-medium">
              Payez et profitez immédiatement, sans créer de compte. Votre accès est valable pendant 48 heures.
            </p>
            <p className="mt-3 text-xs text-orange-400 font-semibold">
              💡 Sécurisez votre accès à tout moment durant ces 48h en le convertissant en compte permanent.
            </p>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 w-full text-center">{error}</p>}

          <button
            onClick={handleQuickAccess}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 rounded-[14px] px-5 py-3.5 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-[#F97316] !bg-[#F97316] anim-glow-pulse border-none shadow-lg shadow-orange-500/20"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Continuer sans compte'
            )}
          </button>
        </div>
      ) : (
        <div className="py-2">
          {/* Permanent Info Card */}
          <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/70 leading-relaxed">
            Accédez à toutes les fonctionnalités sans limite de temps. Votre historique, vos paiements et vos préférences sont sauvegardés pour toujours.
          </div>

          {/* Auth sub-mode toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => switchAuthMode('login')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border-none transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-[#25D366] text-neutral-900 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => switchAuthMode('signup')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border-none transition-all cursor-pointer ${
                authMode === 'signup' ? 'bg-[#25D366] text-neutral-900 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit(handlePermanentSubmit)} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">Nom complet</label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  required
                  {...register('name', { required: authMode === 'signup' })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#25D366] focus:outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Adresse email</label>
              <input
                type="email"
                placeholder="nom@exemple.com"
                required
                {...register('email', { required: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#25D366] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                {...register('password', { required: true, minLength: 8 })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#25D366] focus:outline-none transition-all"
              />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-[14px] px-5 py-3.5 text-base font-bold text-neutral-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-[#25D366] !bg-[#25D366] border-none shadow-lg shadow-[#25D366]/20"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
              ) : authMode === 'login' ? (
                'Se connecter'
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
