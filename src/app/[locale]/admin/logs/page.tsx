import { setRequestLocale } from 'next-intl/server'
import LogExplorer from './log-explorer'

export const metadata = {
    title: 'Log Explorer — Internal',
    robots: { index: false, follow: false },
}

/**
 * Internal admin page for viewing structured logs.
 *
 * Route: /[locale]/admin/logs
 * Protection: The API route (/api/internal/logs) enforces admin access.
 *             In production, set INTERNAL_ADMIN_KEY env variable.
 *
 * This page is a thin server component wrapper that renders the
 * client-side LogExplorer component.
 */
export default async function AdminLogsPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    return <LogExplorer />
}
