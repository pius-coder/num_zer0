import { useState } from 'react'
import { Reveal } from './hooks/reveal'
import { FAQ, CONTACT } from './data'

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" className="bg-[#0f0f0f] overflow-hidden">
      <div className="rounded-[24px] px-5 pt-20 pb-0 max-w-[1200px] w-full mx-auto relative my-16 bg-[#0f0f0f] md:rounded-[32px] md:px-12 md:pt-[120px] md:my-24">
        <Reveal direction="up" threshold={0.2}>
          <div className="flex flex-col items-center text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_12px_0_#25D366] anim-pulse-dot" />
              <span className="font-figtree text-xs font-semibold tracking-[-0.015em] uppercase text-[#4f4f4f]">
                {FAQ.sectionLabel}
              </span>
            </div>

            <h2 className="font-figtree text-[clamp(36px,6vw,72px)] font-[500] tracking-[-0.04em] leading-[1.1] text-white mt-6 max-w-[700px]">
              {FAQ.heading.split('?')[0]}
              <span className="text-white/50">?</span>
            </h2>

            <p className="font-figtree font-medium text-[17px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-4 max-w-[480px]">
              {FAQ.description}
            </p>

            <a
              href={CONTACT.whatsapp}
              className="inline-flex items-center gap-3 no-underline mt-6 font-figtree font-bold text-base tracking-[-0.16px] bg-[#25D366] text-white rounded-[14px] px-5 py-2.5 md:px-6 md:py-3 anim-glow-pulse"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                width="18"
                height="18"
                fill="white"
              >
                <path d="M128,24A104,104,0,0,0,36.18,176.88L24,232l55.12-12.18A104,104,0,1,0,128,24Z" />
              </svg>
              {FAQ.cta}
              <span className="w-8 h-8 border border-dashed border-white/30 rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M7 1v12M1 7h12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </a>
          </div>
        </Reveal>

        <div className="max-w-[760px] mx-auto flex flex-col gap-3 md:gap-4">
          {FAQ.items.map((item, i) => (
            <Reveal
              key={i}
              direction="up"
              stagger={Math.min(i, 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
              threshold={0.1}
              replay
            >
              <div
                className={`rounded-[16px] transition-colors duration-200 ${
                  openIndex === i ? 'bg-white/10' : 'bg-white/[0.04]'
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 p-4 md:p-5 text-left cursor-pointer bg-transparent border-none"
                >
                  <h3 className="font-figtree text-base md:text-[18px] font-[500] tracking-[-0.3px] leading-[1.4] text-white m-0">
                    {item.q}
                  </h3>
                  <span
                    className={`w-8 h-8 border border-dashed border-white/20 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      openIndex === i ? 'bg-[#25D366]/20 border-[#25D366]/40' : ''
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className={`transition-transform duration-200 ${openIndex === i ? 'rotate-45' : ''} ${
                        openIndex === i ? 'text-[#25D366]' : 'text-white'
                      }`}
                    >
                      <path
                        d="M7 1v12M1 7h12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openIndex === i ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-4 md:px-5 md:pb-5">
                    <div className="bg-white/5 rounded-[10px] px-4 py-4 md:px-5 md:py-5">
                      <p className="font-figtree font-medium text-[15px] tracking-[-0.3px] leading-[1.6] text-white/60 m-0">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
