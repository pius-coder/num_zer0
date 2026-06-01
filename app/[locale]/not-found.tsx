import { Link } from '@/i18n/navigation'
import { Button } from '@/component/ui/button'

export default function NotFound() {
  return (
    <div className='relative min-h-screen'>
      <div className='-z-50 pointer-events-none fixed inset-0 bg-[#080808]' />
      <div className='flex min-h-[calc(100vh-120px)] items-center justify-center px-4'>
        <div className='w-full max-w-[410px]'>
          <div className='flex flex-col items-center justify-center'>
            <div className='space-y-1 text-center'>
              <h1 className='text-[32px] font-medium tracking-tight text-zinc-100'>
                Page Not Found
              </h1>
              <p className='text-[16px] text-zinc-500'>
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>
            <div className='mt-8 w-full'>
              <Button
                size='lg'
                className='w-full rounded-[10px] text-[15px] font-medium'
                render={(props) => (
                  <Link {...props} href='/'>
                    Return to Home
                  </Link>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
