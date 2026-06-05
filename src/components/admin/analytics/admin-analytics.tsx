import { useAdminAnalytics } from '../hooks/use-admin-queries'

export function AdminAnalytics() {
  const { data, isLoading } = useAdminAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5 space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-[var(--line)]/30" />
              <div className="h-8 w-16 animate-pulse rounded bg-[var(--line)]/30" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  const deviceEntries = Object.entries(data.deviceCount)
  const countryEntries = Object.entries(data.countryCount)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Sessions" value={data.totalSessions} color="#25D366" />
        <KpiCard label="Clics Achat" value={data.clickBuy} color="#F97316" />
        <KpiCard label="Clics Services" value={data.clickServices} color="#3B82F6" />
        <KpiCard label="Durée Moy." value={`${Math.round(data.avgDurationSeconds)}s`} color="#8B5CF6" />
      </div>

      {deviceEntries.length > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
          <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
            Appareils
          </h3>
          <div className="space-y-3">
            {deviceEntries.map(([device, count]) => (
              <Bar key={device} label={device} count={count} total={data.totalEvents} color="#25D366" />
            ))}
          </div>
        </div>
      )}

      {countryEntries.length > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
          <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
            Pays
          </h3>
          <div className="space-y-3">
            {countryEntries.map(([country, count]) => (
              <Bar key={country} label={country} count={count} total={data.totalEvents} color="#F97316" />
            ))}
          </div>
        </div>
      )}

      {data.recentEvents.length > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
          <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
            Événements Récents
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]/40 text-[var(--sea-ink-soft)] font-semibold uppercase tracking-wider text-[13px]">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Session</th>
                  <th className="pb-3 pr-4">Pays</th>
                  <th className="pb-3 pr-4">Durée</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((ev) => (
                  <tr key={ev._id} className="border-b border-[var(--line)]/20 text-[var(--sea-ink)]">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        ev.eventType === 'visit' ? 'bg-[#25D366]/10 text-[#25D366]'
                        : ev.eventType === 'click_buy' ? 'bg-[#F97316]/10 text-[#F97316]'
                        : ev.eventType === 'click_services' ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-[var(--line)]/20 text-[var(--sea-ink-soft)]'
                      }`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-[var(--sea-ink-soft)]">{ev.sessionId?.slice(0, 12)}</td>
                    <td className="py-3 pr-4">{ev.country ?? '—'}</td>
                    <td className="py-3 pr-4">{ev.durationMs ? `${(ev.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                    <td className="py-3">{new Date(ev.timestamp).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <div className="font-figtree text-[13px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-2">
        {label}
      </div>
      <div className="font-figtree text-[30px] font-medium tracking-[-0.04em]" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between font-figtree text-[14px] mb-1">
        <span className="capitalize">{label}</span>
        <span className="text-[var(--sea-ink-soft)]">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--line)]/20 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
