import CtaSection from './cta-section'
import { FOOTER, SITE } from "./data"

export default function FooterSection() {
  return (
    <section id="contact" className="bg-warm-100 p-3 md:p-6">
      <div className="bg-dark-800 rounded-2xl overflow-hidden relative md:rounded-[32px]">
        <CtaSection />

        <div className="px-5 pb-10 pt-8 text-center relative md:px-10 md:pb-12 md:pt-10">
          <h3 className="font-figtree font-semibold text-xl tracking-[-0.3px] leading-[1.4] text-white m-0">
            {FOOTER.contactHeading}
          </h3>
          <div className="flex justify-center gap-4 mt-5">
            {FOOTER.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener"
                className="font-figtree font-medium text-sm tracking-[-0.14px] leading-[1.4] text-white/65 no-underline"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 mt-10 md:mt-14">
        <div className="text-center">
          <div className="flex justify-center">
            <svg viewBox="0 0 260 51" className="w-auto h-[38px] md:h-[51px]" style={{ overflow: "visible" }}>
              <foreignObject width="100%" height="100%" style={{ overflow: "visible" }}>
                <p className="font-figtree font-bold text-[clamp(36px,8vw,64px)] tracking-[-0.05em] leading-[0.8em] text-dark-900 uppercase m-0 text-center" style={{ whiteSpace: "nowrap" }}>
                  {SITE.name}
                </p>
              </foreignObject>
            </svg>
          </div>
        </div>
        <div className="border-t border-dashed border-black/20 mt-5 pt-5 pb-8 flex flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
          <div className="flex flex-col items-center md:flex-row md:items-center gap-1 md:gap-2">
            <p className="font-figtree font-medium text-sm tracking-[-0.01em] text-dark-900/50 m-0">
              {FOOTER.copyright}
            </p>
            <p className="font-figtree font-medium text-sm tracking-[-0.01em] text-dark-900/50 m-0">
              Powered by{" "}
              <a href={FOOTER.socials[0].href} target="_blank" rel="noopener" className="text-dark-900/60 no-underline hover:underline">
                {FOOTER.poweredBy}
              </a>
            </p>
          </div>
          <div className="flex gap-6">
            {FOOTER.links.map((link) => (
              <a key={link.label} href={link.href} className="font-figtree font-medium text-sm tracking-[-0.01em] text-dark-900/50 no-underline hover:text-dark-900/80">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="h-12 md:h-14" />
    </section>
  )
}
