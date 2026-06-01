import { Link } from '@tanstack/react-router'
import PhoneMockup from './phone-mockup'
import BrowserBadges from './browser-badges'
import { Reveal } from './hooks/reveal'
import { HERO } from './data'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/common/ui/button'

const StarIcon = () => (
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

import { trackers } from '#/lib/trackers'

interface HeroProps {
  isAuthenticated?: boolean
}

export default function Hero({ isAuthenticated }: HeroProps) {
  return (
    <section
      id="hero"
      className="flex flex-col items-center justify-center w-full min-h-[800px] relative px-5 pt-20 pb-15 bg-warm-100 md:px-11 md:pt-[120px] md:pb-20 xl:pt-40 xl:pb-25"
    >
      <div className="flex flex-col items-center w-full max-w-[1200px] relative z-2 gap-[50px] xl:gap-[150px]">
        <div className="flex flex-col items-center w-full gap-5 xl:flex-row xl:items-start xl:gap-20">
          <div className="mt-20 flex flex-col items-start w-full max-w-[600px] gap-5">
            <Reveal direction="up" stagger={1}>
              <div className="inline-flex items-center gap-1.5 border border-dashed border-black/20 rounded-[25px] px-[9px] py-[9px] pr-[15px]">
                <div className="flex items-center justify-center w-3 h-3">
                  <div className="w-2 h-2 bg-[#00BA1F] rounded-full shadow-[0_0_12px_0_rgba(0,186,31,0.3)] opacity-70 anim-pulse-dot" />
                </div>
                <span className="font-figtree text-[14px] font-semibold tracking-[-0.015em] uppercase text-dark-900/65 md:text-[13px]">
                  {HERO.badge}
                </span>
              </div>
            </Reveal>

            <Reveal direction="up" stagger={2}>
              <h1 className="font-serif font-bold text-[clamp(48px,8vw,64px)] tracking-[-4.5px] leading-[1.1] text-dark-900 max-w-full capitalize">
                <span className="inline-block relative">
                  <span className="inline-block px-[4px] rounded-[2px] [background:linear-gradient(100deg,transparent_0%,transparent_5%,rgba(37,211,102,0.3)_5%,rgba(37,211,102,0.3)_95%,transparent_95%,transparent_100%)]">
                    <span className="anim-typewriter">Top 1</span>
                  </span>
                </span>{' '}
                pour obtenir tes numéros virtuels{' '}
                {HERO.services.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex shrink-0 items-center justify-center border bg-clip-padding transition-all outline-none select-none rounded-[20%] w-[clamp(38px,5vw,54px)] h-[clamp(38px,5vw,54px)] bg-dark-900 border-dark-900 hover:brightness-110 align-middle ml-1.5"
                  >
                    <img
                      decoding="async"
                      loading="lazy"
                      width="24"
                      height="auto"
                      src={s.src}
                      alt={s.alt}
                      className="block object-contain w-[clamp(22px,3vw,34px)] h-auto brightness-0 invert"
                    />
                  </span>
                ))}
              </h1>
            </Reveal>

            <Reveal direction="up" stagger={3}>
              <p className="font-figtree font-medium text-[17px] tracking-[-0.025em] leading-[1.4] text-dark-900/75 max-w-[600px]">
                {HERO.description}
              </p>
            </Reveal>

            <Reveal direction="up" stagger={4}>
              <div className="flex flex-row flex-wrap items-center gap-2 w-full mt-2">
                <Link
                  to="/app"
                  onClick={() => trackers.trackClick('click_buy')}
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'gap-2 px-5 py-[10px] rounded-[14px] no-underline text-base font-bold tracking-[-0.16px] h-auto md:px-6 md:py-3 anim-glow-pulse !bg-[#F97316] border-[#F97316] cursor-pointer text-white'
                  )}
                >
                  {isAuthenticated ? 'Accéder au Tableau de Bord' : HERO.cta}
                </Link>
                <a
                  href="#services"
                  onClick={() => trackers.trackClick('click_services')}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'gap-2 px-5 py-[10px] rounded-[14px] no-underline text-base font-medium tracking-[-0.16px] h-auto md:px-6 md:py-3 !text-dark-900 font-semibold'
                  )}
                >
                  {HERO.ctaSecondary}
                </a>
              </div>
            </Reveal>

            <Reveal direction="up" stagger={5}>
              <div className="flex flex-row items-center gap-[18px] w-full mt-4">
                <div className="flex flex-row items-center h-[50px] relative">
                  {HERO.clientAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Client"
                      className="w-[50px] h-[50px] rounded-full border-2 border-dark-900 shadow-[0_7px_20px_0.5px_rgba(0,0,0,0.5)] -ml-[16px] first:ml-0 object-cover"
                    />
                  ))}
                </div>
                <div className="flex flex-col items-start gap-[10px]">
                  <div className="flex flex-row items-center gap-[4px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-[7px]">
                    <p className="font-figtree text-[14px] font-semibold tracking-[-0.015em] leading-[1.2] text-dark-900">
                      {HERO.reviewCount}
                    </p>
                    <p className="font-figtree text-[14px] font-semibold tracking-[-0.015em] leading-[0.9] uppercase text-dark-900/65">
                      {HERO.reviewSub}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="hidden xl:block flex-1 max-w-[400px] anim-float">
            <PhoneMockup />
          </div>
        </div>

        <div className="flex flex-col items-center gap-[10px] w-full xl:hidden">
          <div className="anim-float">
            <PhoneMockup />
          </div>
          <Reveal direction="up">
            <BrowserBadges />
          </Reveal>
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <img
          decoding="async"
          width="4500"
          height="3000"
          src="https://framerusercontent.com/images/rioDBjHp4Ker1doqwtmPpPW9o.jpg?scale-down-to=2048"
          alt=""
          className="block w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 z-1 mix-blend-screen">
        <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png)] bg-repeat bg-[length:128px_auto] bg-[left_top]" />
      </div>
      <div className="absolute z-0 overflow-hidden blur-[48px] rounded-[888px] mix-blend-hard-light h-[300px] left-[-20px] right-[-8px] top-[calc(45.19%-150px)] md:h-[437px] md:left-[-30px] md:right-[-12px] md:top-[calc(45.189%-218.5px)] xl:h-[597px] xl:left-[calc(50%-235px)] xl:right-[unset] xl:top-[211px]">
        <img
          decoding="async"
          width="4500"
          height="3000"
          src="https://framerusercontent.com/images/VkmUcVisuWxL6xmS3bXenYoZ7hQ.jpg?scale-down-to=512"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
      </div>
    </section>
  )
}
