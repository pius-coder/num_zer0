import { setRequestLocale } from 'next-intl/server'
import { ServiceExplorer } from './_components/service-explorer'

const STATS = [
  { label: 'Balance', value: '5', sub: 'credits available' },
  { label: 'Active', value: '0', sub: 'numbers in use' },
  { label: 'Orders', value: '0', sub: 'pending actions' },
  { label: 'Saved', value: '0', sub: 'favorite services' },
]

export default async function MySpacePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 md:px-6 md:py-8">
      {/* ... Hero section ... */}
      <section className="relative isolate overflow-hidden border border-border bg-card px-5 py-6 md:px-8 md:py-8">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.15] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-[#7c3aed] opacity-[0.12] blur-[80px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-44 w-44 -translate-y-1/2 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.08] blur-[60px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-[var(--brand-accent-hex)]/20 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
        <div className="relative z-10">
          <h1 className="text-lg font-bold tracking-tight text-foreground md:text-2xl">
            My Space
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Buy virtual numbers in seconds and verify your accounts with confidence.
          </p>
        </div>
      </section>
      <section>
        <ServiceExplorer />
      </section>
    </div>
  )
}