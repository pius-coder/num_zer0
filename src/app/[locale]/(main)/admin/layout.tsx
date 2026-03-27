import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function OldAdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/admin`)
}
