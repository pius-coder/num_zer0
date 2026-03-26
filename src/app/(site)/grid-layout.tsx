'use client'

interface GridLayoutProps {
  children: React.ReactNode
  className?: string
}

export const GridLayout = ({ children, className = '' }: GridLayoutProps) => {
  return (
    <>
      {/* Background Grid Lines Container - High z-index to appear above section backgrounds */}
      <div className='pointer-events-none fixed inset-0 z-20' aria-hidden='true'>
        <div className='mx-auto h-full'>
          <div className='relative h-full'>
            {/* Left vertical line */}
            <div className='absolute left-0 top-0 h-full w-10 border-x border-x-(--grid-line-color) bg-fixed bg-size-[10px_10px] bg-[repeating-linear-gradient(315deg,var(--grid-line-color)_0,var(--grid-line-color)_1px,transparent_0,transparent_50%)]' />
            {/* Right vertical line */}
            <div className='absolute right-0 top-0 h-full w-10 border-x border-x-(--grid-line-color) bg-fixed bg-size-[10px_10px] bg-[repeating-linear-gradient(315deg,var(--grid-line-color)_0,var(--grid-line-color)_1px,transparent_0,transparent_50%)]' />
          </div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className={`relative ${className}`}>{children}</div>
    </>
  )
}

interface SectionDividerProps {
  className?: string
  /** Landing (NumZero) uses dark hairlines */
  variant?: 'light' | 'dark'
}

export const SectionDivider = ({ className = '', variant = 'light' }: SectionDividerProps) => {
  const line = variant === 'dark' ? 'bg-white/[0.06]' : 'bg-[#E4E4E7]'
  return (
    <div className={`${className}`}>
      <div className={`h-px w-full ${line}`} />
    </div>
  )
}
