import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Direction = 'up' | 'up-big' | 'scale'
type Stagger = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface Props {
  children: ReactNode
  direction?: Direction
  stagger?: Stagger
  className?: string
  threshold?: number
  rootMargin?: string
  as?: 'div' | 'span'
  replay?: boolean
}

const animClass: Record<Direction, string> = {
  up: 'anim-fade-in-up',
  'up-big': 'anim-fade-in-up-big',
  scale: 'anim-scale-in',
}

export function Reveal({
  children,
  direction = 'up',
  stagger = 0,
  className = '',
  threshold = 0.15,
  rootMargin = '0px',
  as = 'div',
  replay = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (replay) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(entry.isIntersecting)
        },
        { threshold, rootMargin },
      )
      observer.observe(el)
      return () => observer.disconnect()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, replay])

  const Tag = as
  const cls =
    `${!visible ? 'anim-ready' : ''} ${visible ? animClass[direction] : ''} stagger-${stagger} ${className}`.trim()

  return (
    <Tag ref={ref} className={cls}>
      {children}
    </Tag>
  )
}
