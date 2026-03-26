import { Card, CardContent } from '@/components/ui/card'

export function SectionBadge({ label }: { label: string }) {
  return (
    <span className='inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700'>
      {label}
    </span>
  )
}

export function ProfileCard({
  title,
  subtitle,
  body,
  accent,
}: {
  title: string
  subtitle: string
  body: string
  accent: string
}) {
  return (
    <Card className='overflow-hidden border-blue-100 shadow-sm'>
      <div className='h-1 w-full' style={{ backgroundColor: accent }} />
      <CardContent className='space-y-2 p-4'>
        <p className='text-xs font-semibold uppercase tracking-wide text-blue-600'>{subtitle}</p>
        <h3 className='text-lg font-bold leading-tight text-slate-900'>{title}</h3>
        <p className='text-sm text-slate-600'>{body}</p>
      </CardContent>
    </Card>
  )
}

export function PhoneFrameMock({
  heading,
  rows,
}: {
  heading: string
  rows: Array<{ left: string; right: string }>
}) {
  return (
    <div className='mx-auto w-full max-w-xs rounded-[2rem] border-8 border-slate-900 bg-white p-4 shadow-xl'>
      <div className='mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-200' />
      <p className='mb-3 text-center text-xs font-semibold text-slate-500'>{heading}</p>
      <div className='space-y-2'>
        {rows.map((row) => (
          <div
            key={`${row.left}-${row.right}`}
            className='flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2'
          >
            <span className='text-xs font-medium text-slate-700'>{row.left}</span>
            <span className='text-xs font-bold text-blue-700'>{row.right}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BubbleChip({ text }: { text: string }) {
  return (
    <span className='inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm'>
      {text}
    </span>
  )
}
