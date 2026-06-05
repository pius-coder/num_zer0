import { SERVICES } from '@/components/services/data'

export function ServiceBadge({ service }: { service: string }) {
  const name = SERVICES.find((s) => s.id === service)?.name ?? service
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-[13px] font-semibold">
      {name.charAt(0)}
    </span>
  )
}
