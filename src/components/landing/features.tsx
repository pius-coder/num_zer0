import QuoteCard from "./quote-card"
import { FeatureCard, CardContent } from "./feature-card"
import { Reveal } from "./hooks/reveal"
import { FEATURES, CONTACT } from "./data"

export default function Features() {
  return (
    <section id="services" className="bg-[#0f0f0f] overflow-hidden">
      <div className="rounded-[24px] px-5 pt-20 pb-0 max-w-[1200px] w-full mx-auto relative my-16 bg-[#0f0f0f] md:rounded-[32px] md:px-12 md:pt-[120px] md:my-24">
        <Reveal direction="up" threshold={0.2}>
          <div className="flex flex-col justify-start items-start w-full md:flex-row md:justify-between">
            <h2 className="font-figtree text-[32px] font-[400] tracking-[-0.04em] leading-[1.1] text-white m-0 max-w-full md:text-[44px] md:flex-1 md:max-w-[560px]">
              {FEATURES.heading}
            </h2>

            <div className="flex flex-col items-start max-w-full mt-7 md:flex-1 md:max-w-[360px] md:pl-14 md:mt-0">
              <p className="font-figtree font-medium text-[16px] tracking-[-0.3px] leading-[1.5] text-white/65 max-w-[360px] m-0 md:text-[18px]">
                {FEATURES.description}
              </p>
              <a
                href={CONTACT.whatsapp}
                className="inline-flex items-center gap-2 rounded-[14px] px-5 py-[10px] no-underline text-white font-figtree font-medium text-base tracking-[-0.16px] mt-[10px] md:px-6 md:py-3 md:mt-3 bg-[#F97316] anim-glow-pulse"
              >
                {FEATURES.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" threshold={0.1}>
          <div className="border border-[#292929] bg-[#121212] rounded-[26px] p-[6px] shadow-[0_1px_0_8px_#171717] grid grid-cols-1 gap-[6px] mt-12 md:grid-cols-2 md:gap-[6px] md:rounded-[44px] md:mt-20">
            <FeatureCard>
              <div className="relative h-[220px] overflow-hidden [mask:linear-gradient(180deg,transparent_0%,black_17.3%,black_45%,black_79.7%,transparent_100%)] md:h-[320px]">
                <div className="w-full h-full [transform:skewY(8deg)]">
                  <img
                    decoding="async"
                    width="320"
                    height="654"
                    src="https://framerusercontent.com/images/aVkOVuDk5orllrm2GEOeCQomlU.png?scale-down-to=512"
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              <CardContent
                title={FEATURES.cards[0].title}
                description={FEATURES.cards[0].description}
              />
            </FeatureCard>

            <div className="flex flex-col gap-[6px]">
              <FeatureCard>
                <div className="relative h-[200px] overflow-hidden md:h-[260px]">
                  <div className="absolute inset-0 blur-[32px] opacity-40">
                    <img
                      decoding="async"
                      width="200"
                      height="200"
                      src="https://framerusercontent.com/images/yyInpEPUSv3YwMHyKzPwuQSkwfE.png?scale-down-to=512"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <CardContent
                  title={FEATURES.cards[1].title}
                  description={FEATURES.cards[1].description}
                />
              </FeatureCard>

              <FeatureCard>
                <div className="relative h-[170px] flex items-center justify-center overflow-hidden [mask:radial-gradient(129%_75%_at_48%_23.2%,black_54%,transparent_100%)] md:h-[220px]">
                  <div className="border border-black/30 rounded-[18px] w-[70%] h-[80%] overflow-hidden [transform:skewX(6deg)_skewY(10deg)]">
                    <img
                      decoding="async"
                      width="309"
                      height="366"
                      src="https://framerusercontent.com/images/qNKUzanDB5DPFj4RnYeqoVb8p0.png?scale-down-to=512"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <CardContent
                  title={FEATURES.cards[2].title}
                  description={FEATURES.cards[2].description}
                />
              </FeatureCard>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" threshold={0.2}>
          <QuoteCard />
        </Reveal>

        <Reveal direction="up" threshold={0.2}>
          <div className="text-center mt-16 md:mt-24">
            <h2 className="font-figtree text-[32px] font-[400] tracking-[-0.04em] leading-[1.1] text-white m-0 md:text-[44px]">
              Gagnez de l'argent en revendant{" "}
              <span className="text-white/65">parrainage et commissions.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-[6px] mt-10 md:grid-cols-3 md:gap-[6px] md:mt-16">
          {FEATURES.bottomCards.map((item, i) => (
            <Reveal key={i} direction="up" stagger={i as 0|1|2|3|4|5|6|7|8} replay>
              <div
                className="border border-[#292929] bg-[#171717] rounded-[26px] p-6 md:rounded-[44px] md:p-8"
                style={{ transform: `rotate(${i === 0 ? "1deg" : i === 1 ? "-1deg" : "1deg"})` }}
              >
                <p className="font-figtree text-[20px] font-[400] tracking-[-0.04em] leading-[1.4] text-white m-0 md:text-[24px]">
                  {item.title}
                </p>
                <p className="font-figtree font-medium text-[14px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-2 md:text-[16px]">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
