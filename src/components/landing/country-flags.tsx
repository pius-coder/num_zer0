import { COUNTRIES } from './data'

const FLAG_BASE = 'https://flagcdn.com/28x21'

export default function CountryFlags() {
  const items = COUNTRIES.map((c, i) => (
    <span key={i} className="inline-flex items-center gap-2.5 whitespace-nowrap mx-5">
      <img
        src={`${FLAG_BASE}/${c.code}.png`}
        srcSet={`${FLAG_BASE}/${c.code}.png 1x, https://flagcdn.com/56x42/${c.code}.png 2x`}
        width="28"
        height="21"
        alt={`${c.name}`}
        className="shrink-0 block"
        loading="lazy"
      />
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
