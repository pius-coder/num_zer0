import type { Dispatch, SetStateAction } from 'react'
import { Link } from '@tanstack/react-router'
import { MOBILE_MENU } from './data'

interface MobileMenuProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  isAuthenticated?: boolean
}

export default function MobileMenu({
  isOpen,
  setIsOpen,
  isAuthenticated,
}: MobileMenuProps) {
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
        <Link
          to="/my-space"
          onClick={() => setIsOpen(false)}
          className="flex items-center justify-center w-full h-full px-4 py-3 no-underline rounded-[14px] bg-[#F97316] border-none cursor-pointer text-white font-figtree font-semibold text-xl tracking-[-0.04em] leading-[1.4]"
        >
          {isAuthenticated ? 'Tableau de Bord' : 'Commencer'}
        </Link>
      </div>
    </div>
  )
}
