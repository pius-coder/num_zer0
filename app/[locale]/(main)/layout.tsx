import { redirect } from 'next/navigation'
import { getServerSession } from '@/common/auth/get-server-session'

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const session = await getServerSession()
  const { locale } = await params

  if (!session) {
    redirect(`/${locale}/login`)
  }

  return <>{children}</>
}
