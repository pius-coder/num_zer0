import { Reveal } from './hooks/reveal'
import { INTEGRATIONS } from './data'

const dapps = [
  { name: 'WhatsApp', img: '/brand/whatsapp.svg', bg: '#25D366', size: 72 },
  { name: 'Telegram', img: '/brand/telegram.svg', bg: '#0088cc', size: 72 },
  { name: 'Facebook', img: '/brand/facebook.svg', bg: '#1877F2', size: 72 },
  { name: 'Instagram', img: '/brand/instagram.svg', bg: '#E4405F', size: 72 },
  { name: 'TikTok', img: '/brand/tiktok.svg', bg: '#000000', size: 72 },
  { name: 'ChatGPT', img: '/brand/chatgpt.svg', bg: '#10A37F', size: 72 },
]

const rotations = [
  'rotate(19deg) rotateX(10deg) rotateY(-50deg)',
  'rotate(0deg) rotateX(50deg) rotateY(0deg)',
  'rotate(-19deg) rotateX(10deg) rotateY(40deg)',
  'rotate(0deg) rotateX(-47deg) rotateY(0deg)',
  'rotate(19deg) rotateX(-20deg) rotateY(60deg)',
  'rotate(-18deg) rotateX(-20deg) rotateY(-60deg)',
]

export default function Integrations() {
  return (
    <section className="bg-warm-100 px-4 py-16 relative overflow-hidden md:px-6 md:py-24">
      <div className="max-w-[1200px] w-full mx-auto relative text-center">
        <Reveal direction="up" threshold={0.2}>
          <h2 className="font-figtree font-semibold text-[clamp(28px,5vw,48px)] tracking-[-1.2px] leading-[1.1] text-dark-900 m-0 max-w-[640px] mx-auto">
            {INTEGRATIONS.heading}
          </h2>
        </Reveal>

        <Reveal direction="up" threshold={0.2}>
          <div className="flex flex-wrap justify-center gap-2 mt-10 perspective-[500px] [transform-style:preserve-3d] md:gap-3 md:mt-16">
            <div className="flex flex-wrap justify-center gap-2 [transform-style:preserve-3d] scale-[0.45] md:gap-3 md:scale-[0.9]">
              {dapps.map((dapp, i) => {
                const r = rotations[i]
                return (
                  <div
                    key={i}
                    className="[transform-style:preserve-3d] flex flex-col items-center"
                    style={{ transform: r }}
                  >
                    <div
                      className="flex items-center justify-center rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300"
                      style={{
                        width: dapp.size + 'px',
                        height: dapp.size + 'px',
                        backgroundColor: dapp.bg,
                      }}
                    >
                      <img
                        decoding="async"
                        width={dapp.size}
                        height={dapp.size}
                        src={dapp.img}
                        alt={dapp.name}
                        className="block w-3/5 h-3/5 object-contain brightness-0 invert"
                      />
                    </div>
                    <p className="font-figtree font-medium text-sm tracking-[-0.14px] leading-[1.4] text-dark-900 mt-2 text-center hidden md:block">
                      {dapp.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" threshold={0.2}>
          <p className="font-figtree font-medium text-base tracking-[-0.3px] leading-[1.4] text-dark-900/75 mt-10 mx-auto max-w-[500px] md:text-lg md:mt-16">
            {INTEGRATIONS.description}
          </p>
        </Reveal>

        <div className="bg-black/12 rounded-[888px] blur-[24px] w-[280px] h-[60px] mt-10 mx-auto max-w-full md:w-[400px]" />
      </div>
    </section>
  )
}
