'use client'

import { ProfileForm } from '@/components/account/profile-form'
import { DeleteAccount } from '@/components/account/delete-account'
import { LogoutButton } from '@/components/account/logout-button'

export function AccountPage() {
  return (
    <div className='mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-6'>
      <header className='space-y-1 px-4'>
        <h1 className='text-2xl font-bold tracking-tight text-foreground md:text-3xl'>
          Paramètres du compte
        </h1>
        <p className='text-[14px] text-muted-foreground'>
          Gérez votre profil et vos préférences.
        </p>
      </header>

      <ProfileForm />
      <DeleteAccount />
      <LogoutButton />
    </div>
  )
}
