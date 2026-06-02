import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/common/ui/button'

export function QuickAccessModal() {
  const navigate = useNavigate()

  const handleContinue = () => {
    navigate({ to: '/my-space' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold">Accès rapide activé</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre accès temporaire de 48 heures est actif.
            </p>
          </div>

          <Button onClick={handleContinue} className="w-full">
            Continuer vers l'application
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Vous pouvez convertir votre compte en compte permanent à tout moment.
          </p>
        </div>
      </div>
    </div>
  )
}
