'use client'

import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/common/css'

interface SwipeToDeleteProps {
  onConfirm: () => void
  disabled?: boolean
}

export function SwipeToDelete({ onConfirm, disabled }: SwipeToDeleteProps) {
  const [position, setPosition] = useState(0)
  const [dragging, setDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startPosition = useRef(0)
  const confirmedRef = useRef(false)

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const getMaxDelta = () => {
    if (!containerRef.current) return 0
    return containerRef.current.offsetWidth - 56
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    confirmedRef.current = false
    startX.current = e.clientX
    startPosition.current = position
    setDragging(true)
    vibrate(10)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return
    const deltaX = e.clientX - startX.current
    const maxDelta = getMaxDelta()
    const next = Math.min(Math.max(0, startPosition.current + deltaX), maxDelta)
    setPosition(next)

    if (!confirmedRef.current && next >= maxDelta * 0.98) {
      confirmedRef.current = true
      setPosition(maxDelta)
      setDragging(false)
      vibrate([12, 20, 18])
      onConfirm()
    }
  }

  const handlePointerEnd = () => {
    if (!dragging) return
    setDragging(false)
    const maxDelta = getMaxDelta()

    if (position >= maxDelta * 0.95) {
      setPosition(maxDelta)
      if (!confirmedRef.current) {
        confirmedRef.current = true
        vibrate([12, 20, 18])
        onConfirm()
      }
      return
    }
    setPosition(0)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-14 w-full rounded-2xl bg-black overflow-hidden border border-border select-none shadow-inner',
        disabled && 'opacity-50 grayscale pointer-events-none'
      )}
    >
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <span className='text-[13px] font-bold text-muted-foreground/40 uppercase tracking-widest animate-pulse'>
          Swipe to confirm
        </span>
      </div>

      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        style={{ transform: `translateX(${position}px)` }}
        className={cn(
          'absolute left-1 top-1 z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive touch-none will-change-transform',
          dragging
            ? 'cursor-grabbing shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'cursor-grab transition-shadow hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
      >
        <Trash2 className='h-5 w-5 text-destructive-foreground' />
      </div>

      <div
        style={{ width: `${position + 24}px` }}
        className='absolute left-0 top-0 h-full bg-destructive/10 transition-[width] duration-75'
      />
    </div>
  )
}
