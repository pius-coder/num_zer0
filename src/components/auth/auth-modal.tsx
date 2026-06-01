import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { useConvexMutation } from '@convex-dev/react-query'
import { useConvex } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Country + Tab, 2: Login, 3: Register
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const convexClient = useConvex()
  const updateCountry = useConvexMutation(api.users.updateUserCountry)

  if (!isOpen) return null

  // Normalize email/phone to email representation for Better Auth
  const getNormalizedEmail = () => {
    if (activeTab === 'email') {
      return emailInput.trim().toLowerCase()
    } else {
      const cleanPhone = phone.trim().replace(/\D/g, '')
      // Check if it already has the 237 prefix, if not, add it
      const prefix = cleanPhone.startsWith('237') ? '' : '237'
      return `phone_${prefix}${cleanPhone}@numzero.com`
    }
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    const idVal = activeTab === 'phone' ? phone : emailInput
    if (!idVal.trim()) {
      toast.error(
        activeTab === 'phone'
          ? 'Veuillez entrer votre numéro de téléphone'
          : 'Veuillez entrer votre adresse e-mail'
      )
      return
    }

    setLoading(true)
    try {
      const email = getNormalizedEmail()
      const res = await convexClient.query(api.users.checkUserExists, {
        identifier: email,
      })

      if (res.exists) {
        setStep(2) // User exists, go to login
      } else {
        setStep(3) // User doesn't exist, go to signup
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error('Veuillez entrer votre mot de passe')
      return
    }

    setLoading(true)
    try {
      const email = getNormalizedEmail()
      await authClient.signIn.email({
        email,
        password,
      })

      try {
        await updateCountry({ country: 'Cameroun' })
      } catch (e) {
        // ignore
      }

      toast.success('Connexion réussie')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Mot de passe incorrect ou erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("Veuillez entrer un nom d'utilisateur")
      return
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const email = getNormalizedEmail()
      await authClient.signUp.email({
        email,
        password,
        name: username,
      })

      try {
        await updateCountry({ country: 'Cameroun' })
      } catch (e) {
        // ignore
      }

      toast.success('Compte créé avec succès')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création de l'compte")
    } finally {
      setLoading(false)
    }
  }

  const handleGuestSignIn = async () => {
    setLoading(true)
    try {
      await authClient.signIn.anonymous()

      try {
        await updateCountry({ country: 'Cameroun' })
      } catch (e) {
        // ignore
      }

      toast.success('Session invité activée')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la connexion invité')
    } finally {
      setLoading(false)
    }
  }

  const getIdentifierLabel = () => {
    if (activeTab === 'email') return emailInput
    return phone.startsWith('+') ? phone : `+237 ${phone}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl flex flex-col gap-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 1 && (
          <form onSubmit={handleNext} className="flex flex-col gap-5">
            <div className="text-center">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                Rejoindre Numzero
              </h3>
              <p className="text-white/60 text-sm">
                Entrez vos coordonnées pour accéder aux services.
              </p>
            </div>

            {/* Country Selector (Deactivated, Cameroun only) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Pays d'origine (Uniquement géré)
              </label>
              <select
                disabled
                value="Cameroun"
                className="w-full bg-[#1e1e1e]/50 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed focus:outline-none"
              >
                <option value="Cameroun">🇨🇲 Cameroun</option>
              </select>
            </div>

            {/* Identifier Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#1e1e1e] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('phone')}
                className={`py-2 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                  activeTab === 'phone'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-transparent text-white/60 hover:text-white'
                }`}
              >
                Téléphone
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`py-2 text-sm font-bold rounded-lg transition-all cursor-pointer border-none ${
                  activeTab === 'email'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-transparent text-white/60 hover:text-white'
                }`}
              >
                E-mail
              </button>
            </div>

            {/* Tab Inputs */}
            {activeTab === 'phone' ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Numéro de Téléphone
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center bg-[#1e1e1e] border border-white/10 rounded-xl px-3.5 text-white/60 text-sm">
                    +237
                  </span>
                  <input
                    type="tel"
                    placeholder="Ex: 699999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  placeholder="Ex: client@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[14px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-[#F97316] border-none shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Continuer'}
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-white/40 text-xs uppercase font-semibold">Ou</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full py-3.5 rounded-[14px] font-bold text-white transition-all hover:bg-white/10 cursor-pointer bg-white/5 border border-white/10 disabled:opacity-50"
            >
              Accès Invité (Rapide 48h)
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="text-center">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                Bon retour !
              </h3>
              <p className="text-white/60 text-sm">
                Entrez votre mot de passe pour vous connecter à{' '}
                <span className="text-white font-semibold">
                  {getIdentifierLabel()}
                </span>
                .
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-[14px] font-bold text-white transition-all bg-white/5 border border-white/10 cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3.5 rounded-[14px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-[#F97316] border-none shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="text-center">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                Créer un compte
              </h3>
              <p className="text-white/60 text-sm">
                Enregistrez votre nouveau compte permanent pour{' '}
                <span className="text-white font-semibold">
                  {getIdentifierLabel()}
                </span>
                .
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-[14px] font-bold text-white transition-all bg-white/5 border border-white/10 cursor-pointer"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3.5 rounded-[14px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-[#F97316] border-none shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {loading ? 'Création...' : "S'inscrire"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
