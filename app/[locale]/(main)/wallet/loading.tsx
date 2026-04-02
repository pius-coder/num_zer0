export default function Loading() {
  return (
    <div className='mx-auto max-w-6xl space-y-5 px-3 pb-4 md:px-6 md:pb-8'>
      <div className='sticky top-0 z-30 -mx-3 md:-mx-6 px-3 md:px-6 py-2.5 bg-background/80 backdrop-blur-xl border-b border-border'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='h-4 w-4 rounded bg-muted animate-pulse' />
            <div className='h-4 w-20 rounded bg-muted animate-pulse' />
          </div>
          <div className='space-y-3'>
            <div className='h-10 w-32 rounded-lg bg-muted animate-pulse' />
            <div className='grid grid-cols-3 gap-2'>
              <div className='h-12 rounded-lg bg-muted animate-pulse' />
              <div className='h-12 rounded-lg bg-muted animate-pulse' />
              <div className='h-12 rounded-lg bg-muted animate-pulse' />
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='space-y-3'>
          <div className='h-5 w-48 rounded bg-muted animate-pulse' />
          <div className='grid grid-cols-3 gap-1'>
            <div className='h-9 rounded-md bg-muted animate-pulse' />
            <div className='h-9 rounded-md bg-muted animate-pulse' />
            <div className='h-9 rounded-md bg-muted animate-pulse' />
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='rounded-xl p-3 flex items-center justify-between'>
            <div className='space-y-2'>
              <div className='h-4 w-40 rounded bg-muted animate-pulse' />
              <div className='h-3 w-24 rounded bg-muted animate-pulse' />
            </div>
            <div className='space-y-2 text-right'>
              <div className='h-4 w-16 rounded bg-muted animate-pulse ml-auto' />
              <div className='h-3 w-20 rounded bg-muted animate-pulse ml-auto' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
