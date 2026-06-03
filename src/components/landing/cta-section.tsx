import { CTA, CONTACT } from './data'

export default function CtaSection() {
  return (
    <>
      <div className="absolute inset-0 [mask:radial-gradient(60%_92%_at_50%_105.3%,black_0%,transparent_95%)]">
        <img
          decoding="async"
          width="1200"
          height="800"
          src="https://framerusercontent.com/images/3MMx8105CXwBQEqnGqdoqu6t24Q.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative px-5 py-12 text-center md:px-10 md:py-20">
        <h2 className="font-figtree font-semibold text-[clamp(28px,5vw,48px)] tracking-[-1.2px] leading-[1.1] text-white max-w-[700px] mx-auto">
          {CTA.heading} 🇺🇸🇫🇷🇨🇦
        </h2>

        <a
          href={CONTACT.whatsapp}
          className="inline-flex items-center gap-2 border border-[#25D366] bg-[#25D366] rounded-[14px] px-5 py-[10px] mt-8 no-underline text-white font-figtree font-medium text-base tracking-[-0.16px] md:px-6 md:py-3 anim-glow-pulse"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            width="20"
            height="20"
            fill="white"
          >
            <path d="M128,24A104,104,0,0,0,36.18,176.88L24,232l55.12-12.18A104,104,0,1,0,128,24Z" />
          </svg>
          {CTA.button}
        </a>

        <div className="flex flex-col items-center justify-center gap-3 mt-6 md:flex-row">
          <p className="font-figtree font-medium text-sm tracking-[-0.14px] leading-[1.4] text-white/65 m-0">
            {CTA.paymentText}
          </p>
          <div className="flex gap-2">
            {[
              { src: '/brand/om.png', alt: 'Orange Money', rot: 'rotate(2deg)' },
              { src: '/brand/momo.png', alt: 'MTN Mobile Money', rot: 'rotate(-2deg)' },
            ].map((b, i) => (
              <img
                key={i}
                decoding="async"
                width="60"
                height="40"
                src={b.src}
                alt={b.alt}
                className="rounded-lg w-[52px] md:w-[60px] h-auto"
                style={{ transform: b.rot }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
