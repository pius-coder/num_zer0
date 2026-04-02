import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/common/auth/get-server-session'
import { ProfileForm } from '@/component/account/profile-form'
import { DeleteAccount } from '@/component/account/delete-account'
import { LogoutButton } from '@/component/account/logout-button'

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await getServerSession()
  if (!session) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className='mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-6'>
      <header className='space-y-1 px-4'>
        <h1 className='text-2xl font-bold tracking-tight text-foreground md:text-3xl'>
          Account Settings
        </h1>
        <p className='text-[14px] text-muted-foreground'>
          Manage your profile and account preferences.
        </p>
      </header>

      <ProfileForm />
      <DeleteAccount locale={locale} />
      <LogoutButton locale={locale} />
    </div>
  )
}
