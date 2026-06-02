'use client'

import { MySpaceHeroMobile } from '@/components/spa/my-space-hero-mobile'
import { MySpaceHeroDesktop } from '@/components/spa/my-space-hero-desktop'

export function MySpacePage() {
  return (
    <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
      <MySpaceHeroMobile />
      <MySpaceHeroDesktop />
      <div className='text-center py-20 text-muted-foreground'>
        Contenu à venir
      </div>
    </div>
  )
}
