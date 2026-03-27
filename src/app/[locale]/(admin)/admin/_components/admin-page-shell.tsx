import type { ReactNode } from 'react'

interface AdminPageShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, subtitle, actions, children }: AdminPageShellProps) {
  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          {subtitle && <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p>}
        </div>
        {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
      </div>
      {children}
    </div>
  )
}
