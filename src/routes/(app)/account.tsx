import { createFileRoute } from '@tanstack/react-router'
import { ProfileForm, DeleteAccount, LogoutButton } from '#/components/account'

export const Route = createFileRoute('/(app)/account')({
  ssr: true,
  component: AccountPage,
})

function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-4 md:px-6 md:pb-8">
      <h1 className="text-xl font-bold">Mon Compte</h1>
      <ProfileForm />
      <LogoutButton />
      <DeleteAccount />
    </div>
  )
}
