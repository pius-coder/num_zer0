import { Reveal } from './hooks/reveal'
import { PRICING } from './data'

export default function Security() {
  return (
    <section
      id="pricing"
      className="bg-warm-100 px-4 py-16 relative overflow-hidden md:px-6 md:py-24"
    >
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.5)_1px,transparent_0)] [background-size:32px_32px]" />
      <div className="absolute flex-none h-[562px] left-[calc(50%-559.5px)] overflow-visible top-0 w-[1119px] z-0 border border-dashed border-dark-900/12 pointer-events-none" />

      <div className="max-w-[1200px] w-full mx-auto relative grid grid-cols-1 gap-8 items-center md:grid-cols-2 md:gap-12">
        <Reveal direction="up" threshold={0.2} as="div">
          <div>
            <h2 className="font-figtree font-semibold text-[clamp(28px,5vw,48px)] tracking-[-1.2px] leading-[1.1] text-dark-900/75 m-0">
              Tarifs{' '}
              <span className="text-dark-900">
                {PRICING.heading.replace('Tarifs à partir de ', 'à partir de ')}
              </span>
            </h2>
            <p className="font-figtree font-medium text-base tracking-[-0.3px] leading-[1.4] text-dark-900/75 mt-4 md:text-lg">
              {PRICING.description}
            </p>

            <div className="flex flex-col gap-2 mt-10">
              {PRICING.plans.map((s, i) => (
                <Reveal
                  key={s.label}
                  direction="up"
                  stagger={Math.min(i, 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                  threshold={0.1}
                  as="div"
                  replay
                >
                  <div className="bg-warm-100 rounded-[12px] px-[18px] py-[14px] flex flex-row gap-[10px] items-center">
                    <div className="flex-none h-5 w-5 relative">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#25D366"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-full h-full"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <p className="font-figtree font-medium text-base tracking-[-0.16px] leading-[1.4] text-dark-900 m-0">
                        {s.flag} {s.label}
                      </p>
                      <span className="font-figtree font-semibold text-base text-[#25D366]">
                        {s.price}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal direction="up" threshold={0.2}>
              <div className="mt-10 px-6 py-5 bg-[rgb(232,228,222)] rounded-[16px] border border-black/8">
                <h3 className="font-figtree font-semibold text-lg text-dark-900 m-0">
                  {PRICING.earnHeading}
                </h3>
                <p className="font-figtree font-medium text-[15px] text-dark-900/75 mt-2 leading-[1.5]">
                  Parrainez vos proches et gagnez des commissions sur chaque dépôt. Vous pouvez
                  aussi revendre nos services à vos propres clients.
                </p>
              </div>
            </Reveal>
          </div>
        </Reveal>

        <Reveal direction="up" threshold={0.2} stagger={4}>
          <div className="border-r border-dark-900 rounded-[20px] overflow-hidden relative anim-float-slow">
            <div className="absolute inset-0 brightness-[0.3] contrast-[1.5]">
              <img
                decoding="async"
                width="512"
                height="300"
                src="https://framerusercontent.com/images/0zpNQr9uXE3ZfYqMAPqXWVktQ.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 saturate-0 [mask:linear-gradient(180deg,black_17%,transparent_100%)] opacity-20">
              <img
                decoding="async"
                width="1200"
                height="675"
                src="https://framerusercontent.com/images/dQg9YfLvxNYTLvyRoj1NXdMRGw.jpg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative flex items-center justify-center min-h-[300px] p-6 md:min-h-[400px] md:p-10">
              <div className="rounded-[12px] w-[160px] h-auto overflow-hidden md:w-[205px]">
                <img
                  decoding="async"
                  width="205"
                  height="208"
                  src="https://framerusercontent.com/images/CEwJTdgwiTStUCpa9ZJrXv0eelY.png?scale-down-to=1024"
                  alt=""
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
