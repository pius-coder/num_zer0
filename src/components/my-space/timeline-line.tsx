export function TimelineLine({ done, active, label, value }: {
  done: boolean
  active?: boolean
  label: string
  value?: string
}) {
  const color = done ? 'text-[#25D366]' : active ? 'text-amber-500' : 'text-gray-400'
  return (
    <div className="flex items-center gap-3">
      <span className={`font-figtree text-[15px] font-semibold ${color}`}>
        {done ? '✓' : active ? '○' : '○'}
      </span>
      <div>
        <span className={`font-figtree text-[15px] font-semibold tracking-wider ${color}`}>
          {label}
        </span>
        {value && (
          <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] ml-2">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
