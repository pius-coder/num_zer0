'use client'

import { memo, useCallback, useState } from 'react'

interface CountryFlagProps {
  src: string
  alt: string
  fallbackLetter: string
}

export const CountryFlag = memo(function CountryFlag({
  src,
  alt,
  fallbackLetter,
}: CountryFlagProps) {
  const [failed, setFailed] = useState(false)

  const onError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      ;(e.target as HTMLImageElement).style.display = 'none'
      const parent = (e.target as HTMLImageElement).parentElement
      if (parent) {
        parent.textContent = fallbackLetter.charAt(0).toUpperCase()
        parent.className =
          'size-6 rounded flex items-center justify-center bg-primary/10 text-primary font-bold text-xs shrink-0'
      }
      setFailed(true)
    },
    [fallbackLetter]
  )

  if (failed) return null

  return (
    <div className='size-6 rounded overflow-hidden flex items-center justify-center bg-muted shrink-0'>
      <img src={src} alt={alt} className='size-6 object-contain' onError={onError} />
    </div>
  )
})
