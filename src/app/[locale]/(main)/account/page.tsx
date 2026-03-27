import { setRequestLocale } from 'next-intl/server'
import { ProfileForm } from './_components/profile-form'
import { DeleteAccount } from './_components/delete-account'
import { getServerSession } from '@/lib/auth/get-server-session'
import { redirect } from 'next/navigation'

export default async function AccountPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const session = await getServerSession()
    if (!session) {
        redirect(`/${locale}/login`)
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-6">
            {/* ── Header ── */}
            <header className="space-y-1 px-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    Account Settings
                </h1>
                <p className="text-[14px] text-muted-foreground">
                    Manage your profile and account preferences.
                </p>
            </header>

            {/* ── Profile Section ── */}
            <ProfileForm />

            {/* ── Danger Zone ── */}
            <DeleteAccount locale={locale} />


        </div>
    )
}
