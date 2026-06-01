import type { Dispatch, SetStateAction } from "react"
import { MOBILE_MENU, CONTACT } from "./data"

interface MobileMenuProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

const REMIX_SHADOW = "rgba(0,0,0,0.68) 0px -0.48175px 0.48175px -1.25px inset, rgba(0,0,0,0.596) 0px -1.83083px 1.83083px -2.5px inset, rgba(0,0,0,0.235) 0px -8px 8px -3.75px inset"

export default function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div
      data-border="true"
      data-framer-name="Dropdown"
      className="flex flex-col items-start justify-start w-full gap-[22px] px-0 pt-4 pb-3 relative border-t border-dark-700"
    >
      <div
        data-framer-name="Tabs"
        className="flex flex-col items-start justify-start w-full gap-3 relative z-8"
      >
        {MOBILE_MENU.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className="block no-underline bg-transparent w-full"
          >
            <h3 className="font-figtree font-medium text-[32px] tracking-[-0.04em] leading-[1.4] text-left text-white m-0 whitespace-pre">
              {link.label}
            </h3>
          </a>
        ))}
      </div>

      <div className="flex-none h-11 w-full relative">
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center w-full h-full px-4 py-3 no-underline rounded-[14px] bg-[#F97316]"
        >
          <p className="font-figtree font-semibold text-xl tracking-[-0.04em] leading-[1.4] text-center text-white m-0 whitespace-pre">
            Acheter un numéro
          </p>
        </a>
      </div>
      <div className="flex-none h-11 w-full relative">
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center w-full h-full px-4 py-3 no-underline border border-dark-700 bg-dark-700 rounded-[14px] shadow-[var(--remix-shadow)]"
          style={{ boxShadow: REMIX_SHADOW }}
        >
          <p className="font-figtree font-medium text-xl tracking-[-0.04em] leading-[1.4] text-center text-white m-0 whitespace-pre">
            Recharger
          </p>
        </a>
      </div>
    </div>
  )
}
