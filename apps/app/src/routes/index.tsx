import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@/aura/client'
import { api } from '@/aura/_generated/api'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isPending } = useQuery(api.system.health)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Aura Stack</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          {isPending ? 'Loading...' : data?.ok ? 'System OK' : 'System Error'}
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          {data ? `Last checked: ${new Date(data.ts).toLocaleString()}` : 'Hono + TanStack Start + Aura'}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/todos"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-lg transition hover:opacity-90"
          >
            Voir les tâches
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}
