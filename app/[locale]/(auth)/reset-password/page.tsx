import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/component/auth'

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={<div className='text-center text-muted-foreground'>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
