import { createFileRoute } from '@tanstack/react-router'
import { SupportOptions, SupportMessageForm } from '#/components/support'

export const Route = createFileRoute('/(app)/support')({
  ssr: true,
  component: SupportPage,
})

function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-4 md:px-6 md:pb-8">
      <h1 className="text-xl font-bold">Support</h1>
      <p className="text-sm text-muted-foreground">
        Besoin d'aide ? Contactez-nous via l'un de nos canaux.
      </p>
      <SupportOptions />
      <SupportMessageForm />
    </div>
  )
}
