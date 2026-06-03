import { COUNTRIES } from './data'

export default function CountryFlags() {
  const items = COUNTRIES.map((c, i) => (
    <span key={i} className="inline-flex items-center gap-2.5 whitespace-nowrap mx-5">
      <span className="text-[28px] leading-none">{c.flag}</span>
      <span className="font-figtree font-medium text-[15px] tracking-[-0.02em] text-dark-900">
        {c.name}
      </span>
    </span>
  ))

  return (
    <div className="w-full overflow-hidden bg-warm-100 py-5 md:py-6 border-t border-black/6">
      <div className="anim-ticker-reverse flex" style={{ width: 'max-content' }}>
        <div className="flex items-center shrink-0">{items}</div>
        <div className="flex items-center shrink-0">{items}</div>
      </div>
    </div>
  )
}
