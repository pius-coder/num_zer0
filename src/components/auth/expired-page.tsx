import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/common/ui/button'

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
          <h1 className="text-2xl font-bold">Votre accès a expiré</h1>
          <p className="mt-2 text-muted-foreground">
            Votre accès temporaire de 48 heures a expiré.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate({ to: '/' })}>
            Créer un compte permanent
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  )
}
