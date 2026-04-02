'use client'

export default function ErrorBoundary({ reset }: { error: globalThis.Error; reset: () => void }) {
  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4'>
      <h2 className='text-lg font-medium text-destructive'>Something went wrong</h2>
      <button
        onClick={reset}
        className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground'
      >
        Try again
      </button>
    </div>
  )
}
