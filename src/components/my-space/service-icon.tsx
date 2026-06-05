'use client'

import { useState } from 'react'
import { SVG_IDS, NO_ICON_IDS } from './constants'

function IconLetter({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
      {name.charAt(0)}
    </span>
  )
}

export function ServiceIcon({ serviceId, name }: { serviceId: string; name: string }) {
  if (NO_ICON_IDS.has(serviceId)) return <IconLetter name={name} />

  const preferredExt = SVG_IDS.has(serviceId) ? 'svg' : 'webp'
  const [ext, setExt] = useState(preferredExt)
  const [errored, setErrored] = useState(false)

  if (errored) return <IconLetter name={name} />

  return (
    <img
      src={`/assets/services/${serviceId}.${ext}`}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-[var(--sea-ink)]/5"
      loading="lazy"
      onError={() => {
        if (ext === 'webp') setExt('svg')
        else if (ext === 'svg') setExt('webp')
        else setErrored(true)
      }}
    />
  )
}
