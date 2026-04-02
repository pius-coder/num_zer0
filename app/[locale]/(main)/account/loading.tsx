import { Skeleton } from '@/component/ui/skeleton'

export default function AccountLoading() {
  return (
    <div className='mx-auto max-w-2xl space-y-8 px-4 py-8 md:px-6'>
      <header className='space-y-2 px-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-72' />
      </header>

      <div className='space-y-4 rounded-xl border bg-card p-6'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
      </div>

      <div className='space-y-4 rounded-xl border bg-card p-6'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-10 w-32' />
      </div>

      <div className='flex justify-end'>
        <Skeleton className='h-10 w-28' />
      </div>
    </div>
  )
}
