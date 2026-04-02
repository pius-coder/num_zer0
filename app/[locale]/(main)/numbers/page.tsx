import { redirect } from 'next/navigation'

export default async function NumbersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/my-space?tab=numbers`)
}
