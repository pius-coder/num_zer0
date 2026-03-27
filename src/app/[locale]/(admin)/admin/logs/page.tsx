import { setRequestLocale } from 'next-intl/server'

import LogExplorer from '@/app/[locale]/admin/logs/log-explorer'

export const metadata = {
  title: 'Log Explorer — Internal',
  robots: { index: false, follow: false },
}

export default async function AdminLogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LogExplorer />
}
