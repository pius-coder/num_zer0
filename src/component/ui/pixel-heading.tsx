'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/common/css'

type PixelFont = 'square' | 'grid' | 'circle' | 'triangle' | 'line'

const PIXEL_FONT_MAP: Record<PixelFont, string> = {
  square: 'font-pixel-square',
  grid: 'font-pixel-grid',
  circle: 'font-pixel-circle',
  triangle: 'font-pixel-triangle',
  line: 'font-pixel-line',
}

const PIXEL_FONTS = Object.values(PIXEL_FONT_MAP)
const PIXEL_FONT_KEYS = Object.keys(PIXEL_FONT_MAP) as PixelFont[]

export interface PixelHeadingProps extends React.ComponentProps<'h1'> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  initialFont?: PixelFont
  hoverFont?: PixelFont
  cycleInterval?: number
  defaultFontIndex?: number
  onFontIndexChange?: (index: number) => void
  showLabel?: boolean
  disableHover?: boolean
  disableCycling?: boolean
}

export function PixelHeading({
  children,
  as: Tag = 'h1',
  className,
  initialFont,
  hoverFont,
  cycleInterval = 300,
  defaultFontIndex = 0,
  onFontIndexChange,
  showLabel = false,
  disableHover = false,
  disableCycling = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: PixelHeadingProps) {
  const resolvedDefaultIndex = initialFont ? PIXEL_FONT_KEYS.indexOf(initialFont) : defaultFontIndex

  const hoverIndex = hoverFont ? PIXEL_FONT_KEYS.indexOf(hoverFont) : null
  const isSwapMode = hoverIndex !== null

  const [fontIndex, setFontIndex] = useState(resolvedDefaultIndex)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const advanceFont = useCallback(() => {
    setFontIndex((prev) => {
      const next = (prev + 1) % PIXEL_FONTS.length
      onFontIndexChange?.(next)
      return next
    })
  }, [onFontIndexChange])

  const startCycling = useCallback(() => {
    setIsActive(true)
    intervalRef.current = setInterval(advanceFont, cycleInterval)
  }, [advanceFont, cycleInterval])

  const stopCycling = useCallback(() => {
    setIsActive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const swapToHover = useCallback(() => {
    if (hoverIndex === null) return
    setIsActive(true)
    setFontIndex(hoverIndex)
    onFontIndexChange?.(hoverIndex)
  }, [hoverIndex, onFontIndexChange])

  const swapToInitial = useCallback(() => {
    setIsActive(false)
    setFontIndex(resolvedDefaultIndex)
    onFontIndexChange?.(resolvedDefaultIndex)
  }, [resolvedDefaultIndex, onFontIndexChange])

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLHeadingElement>) => {
      if (!disableHover) {
        if (isSwapMode) {
          swapToHover()
        } else if (!disableCycling) {
          startCycling()
        }
      }
      onMouseEnter?.(e)
    },
    [disableHover, disableCycling, isSwapMode, swapToHover, startCycling, onMouseEnter]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLHeadingElement>) => {
      if (!disableHover) {
        isSwapMode ? swapToInitial() : stopCycling()
      }
      onMouseLeave?.(e)
    },
    [disableHover, isSwapMode, swapToInitial, stopCycling, onMouseLeave]
  )

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLHeadingElement>) => {
      if (!disableHover) {
        isSwapMode ? swapToHover() : setIsActive(true)
      }
      onFocus?.(e)
    },
    [disableHover, isSwapMode, swapToHover, onFocus]
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLHeadingElement>) => {
      if (!disableHover) {
        isSwapMode ? swapToInitial() : setIsActive(false)
      }
      onBlur?.(e)
    },
    [disableHover, isSwapMode, swapToInitial, onBlur]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLHeadingElement>) => {
      if (!disableHover && !disableCycling) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isSwapMode) advanceFont()
        }
      }
      onKeyDown?.(e)
    },
    [disableHover, disableCycling, isSwapMode, advanceFont, onKeyDown]
  )

  const currentFontLabel = PIXEL_FONT_KEYS[fontIndex]

  return (
    <div data-slot='pixel-heading' className='inline-flex flex-col items-start gap-2'>
      <Tag
        data-state={isActive ? 'active' : 'idle'}
        data-font={currentFontLabel}
        tabIndex={0}
        className={cn(
          'cursor-default select-none transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          PIXEL_FONTS[fontIndex],
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </Tag>
      {showLabel && (
        <output
          data-slot='pixel-heading-label'
          aria-live='polite'
          className={cn(
            'text-xs uppercase tracking-widest text-muted-foreground transition-opacity duration-200',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        >
          {currentFontLabel}
        </output>
      )}
    </div>
  )
}
