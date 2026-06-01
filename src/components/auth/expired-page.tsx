import { useNavigate } from '@tanstack/react-router'

export function ExpiredPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Votre accès temporaire a expiré</h1>
          <p className="mt-3 text-sm text-neutral-400 max-w-sm leading-relaxed">
            Créez un compte permanent pour retrouver l'accès à vos paiements et continuer à utiliser le service normalement.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => navigate({ to: '/' })} className="w-full bg-[#25D366] text-neutral-900 font-bold hover:brightness-110 h-auto py-2.5 rounded-[14px] cursor-pointer border-none shadow-lg shadow-[#25D366]/20">
            Créer mon compte
          </button>
          <button onClick={() => navigate({ to: '/' })} className="w-full flex justify-center items-center h-auto py-2.5 rounded-[14px] bg-transparent hover:bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all text-sm font-semibold cursor-pointer">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}
