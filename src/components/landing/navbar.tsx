import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MenuIcon, CloseIcon } from './menu-icons'
import MobileMenu from './mobile-menu'
import { NAV, SITE } from './data'

const NAV_BOX_SHADOW =
  'rgba(0,0,0,0.184) 0px 0.636953px 0.636953px -0.9375px, rgba(0,0,0,0.173) 0px 1.9316px 1.9316px -1.875px, rgba(0,0,0,0.15) 0px 5.10612px 5.10612px -2.8125px, rgba(0,0,0,0.063) 0px 16px 16px -3.75px'

interface NavbarProps {
  isAuthenticated?: boolean
}

export default function Navbar({ isAuthenticated }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex-none fixed left-1/2 -translate-x-1/2 top-3 w-[calc(100vw-24px)] z-10 md:top-6 md:w-[480px]">
      <nav
        className="flex flex-col items-center justify-start w-full h-min rounded-[16px] md:rounded-[72px] md:items-center md:justify-center"
        style={{ boxShadow: NAV_BOX_SHADOW }}
      >
        <div
          data-border="true"
          data-framer-name="Navigation Bar"
          className="w-full gap-[10px] px-5 py-[10px] relative z-10 border border-dark-700 bg-dark-800 rounded-[16px] md:flex md:flex-row md:items-center md:justify-center md:gap-9 md:overflow-hidden md:px-[10px] md:py-[10px] md:pl-5 md:rounded-[72px] md:backdrop-blur-[12px]"
          style={{ boxShadow: 'none' }}
        >
          <div className="flex items-center justify-between w-full md:flex-1 md:w-[1px] md:max-w-[1440px]">
            <div className="flex items-center justify-start flex-1 gap-9 pr-5 md:pr-5">
              <a
                href="./"
                className="flex flex-col items-center justify-center self-stretch no-underline z-2"
              >
                <span className="font-kubo font-bold text-[22px] text-[#25D366] md:text-xl">
                  {SITE.shortName}
                </span>
              </a>

              <div className="hidden items-center justify-end flex-1 gap-5 relative z-8 md:flex">
                {NAV.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-white/65 text-[15px] font-medium tracking-[-0.01em] leading-[1.2] no-underline"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <Link
              to="/my-space"
              className="hidden items-center justify-center gap-[6px] px-4 py-[8px] no-underline bg-[#25D366] rounded-[120px] md:flex cursor-pointer border-none font-bold text-neutral-900 text-[14px]"
            >
              {isAuthenticated ? 'Tableau de Bord' : NAV.ctaDesktop}
            </Link>

            <div className="flex-none h-[30px] w-[30px] relative z-2 md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer bg-none border-none p-0 w-full h-full block"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
              >
                {isOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          <div className="md:hidden w-full">
            <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </nav>
    </div>
  )
}
