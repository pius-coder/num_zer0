import { TESTIMONIALS } from './data'

const StarIconYellow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M7 0L8.993 4.007L13 6L8.993 7.993L7 12L5.007 7.993L1 6L5.007 4.007L7 0Z"
      fill="#FFD700"
    />
  </svg>
)

export default function Testimonials() {
  const allItems = [...TESTIMONIALS.items, ...TESTIMONIALS.items]
  const items = allItems.map((t, i) => (
    <li key={i} className="flex-shrink-0 w-full" style={{ height: 'fit-content' }}>
      <div className="bg-dark-800 border border-white/10 rounded-[20px] p-6 md:p-7">
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: t.rating }).map((_, j) => (
            <StarIconYellow key={j} />
          ))}
        </div>
        <p className="font-figtree text-[15px] md:text-[16px] tracking-[-0.02em] leading-[1.5] text-white/85 m-0 italic">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="mt-4 pt-3 border-t border-white/8">
          <p className="font-figtree font-semibold text-[14px] tracking-[-0.01em] text-white m-0">
            {t.name}
          </p>
          <p className="font-figtree text-[13px] tracking-[-0.01em] text-white/50 m-0 mt-0.5">
            {t.title}
          </p>
        </div>
      </div>
    </li>
  ))

  return (
    <section className="bg-[#0f0f0f] overflow-hidden py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-5 md:px-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 md:mb-16">
          <div>
            <p className="font-figtree text-[13px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">
              {TESTIMONIALS.sectionLabel}
            </p>
            <h2 className="font-figtree text-[32px] md:text-[44px] font-[400] tracking-[-0.04em] leading-[1.1] text-white m-0">
              {TESTIMONIALS.heading}
            </h2>
          </div>
          <p className="font-figtree text-[15px] md:text-[16px] tracking-[-0.02em] leading-[1.5] text-white/50 max-w-[360px] mt-3 md:mt-0 m-0">
            {TESTIMONIALS.description}
          </p>
        </div>

        <div className="relative h-[520px] md:h-[560px] overflow-hidden mask-edges">
          <ul className="flex flex-col gap-4 anim-ticker-up" style={{ width: '100%' }}>
            {items}
          </ul>
        </div>
      </div>
    </section>
  )
}
