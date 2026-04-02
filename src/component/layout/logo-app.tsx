'use client'

import { PixelHeading } from '@/component/ui/pixel-heading'

interface LogoAppProps {
  className?: string
}

export function LogoApp({ className = '' }: LogoAppProps) {
  return (
    <PixelHeading
      as='h1'
      initialFont='line'
      hoverFont='circle'
      className={`tracking-tight ${className}`}
    >
      NumZero
    </PixelHeading>
  )
}
