'use client'

import { useSession } from '@/common/auth/auth-client'
import { UserCircle, ShieldCheck, LoaderCircle } from 'lucide-react'
import { emailToPhone } from '@/common/auth/phone-utils'
import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/component/ui/button'
import { Separator } from '@/component/ui/separator'
import { Skeleton } from '@/component/ui/skeleton'
import { toastManager } from '@/component/ui/toast'
import { clientLogger } from '@/common/logger/client-logger'
import { updateUserAction } from '@/actions/user.action'

export function ProfileForm() {
  const { data: session, refetch, isPending: isSessionLoading } = useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.name])

  const displayIdentifier = session?.user?.email
    ? (emailToPhone(session.user.email) ?? session.user.email)
    : (session?.user?.phoneNumber ?? 'N/A')

  const handleUpdate = async () => {
    if (!name.trim()) {
      toastManager.add({
        title: 'Error',
        description: 'Name cannot be empty',
        type: 'error',
      })
      return
    }

    startTransition(async () => {
      clientLogger.info('Initiating profile update via Server Action', { name })
      try {
        const result = await updateUserAction({
          name: name.trim(),
        })

        if (!result.success) {
          clientLogger.error('Profile update failed (Server Action)', { error: result.error })
          throw new Error(result.error || 'Failed to update profile')
        }

        clientLogger.info('Profile update successful via Server Action')

        toastManager.add({
          title: 'Success',
          description: 'Profile updated successfully',
          type: 'success',
        })

        await refetch()
      } catch (err) {
        clientLogger.error(
          'Unhandled profile update error',
          err instanceof Error ? err : { message: String(err) }
        )
        toastManager.add({
          title: 'Update failed',
          description:
            err instanceof Error ? err.message : 'Could not update profile. Please try again.',
          type: 'error',
        })
      }
    })
  }

  if (isSessionLoading && !session) {
    return (
      <section className='space-y-3'>
        <Skeleton className='mx-4 h-4 w-32 rounded-full' />
        <div className='overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/20'>
          <div className='flex items-center gap-4 px-4 py-3.5'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-2xl' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-3 w-16 rounded-full' />
              <Skeleton className='h-4 w-full rounded-full' />
            </div>
          </div>
          <Separator className='mx-4 w-auto bg-border/50' />
          <div className='flex items-center gap-4 px-4 py-3.5 opacity-60'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-2xl' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-3 w-24 rounded-full' />
              <Skeleton className='h-4 w-32 rounded-full' />
            </div>
          </div>
        </div>
        <div className='px-4 pt-1'>
          <Skeleton className='h-12 w-full rounded-2xl' />
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-3'>
      <h2 className='px-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground'>
        Personal Information
      </h2>

      <div className='overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/20'>
        <div className='flex items-center gap-4 px-4 py-3.5'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <UserCircle className='h-6 w-6' />
          </div>
          <div className='flex-1 space-y-0.5'>
            <label htmlFor='name' className='text-[12px] font-medium text-muted-foreground'>
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Your name'
              className='w-full bg-transparent text-[15px] font-semibold text-foreground placeholder:text-muted-foreground outline-none'
            />
          </div>
        </div>

        <Separator className='mx-4 w-auto bg-border/50' />

        <div className='flex items-center gap-4 px-4 py-3.5 opacity-60'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/10 text-muted-foreground'>
            <ShieldCheck className='h-6 w-6' />
          </div>
          <div className='flex-1 space-y-0.5'>
            <span className='text-[12px] font-medium text-muted-foreground'>
              Identifier (Phone)
            </span>
            <p className='text-[15px] font-semibold text-foreground'>{displayIdentifier}</p>
          </div>
        </div>
      </div>

      <div className='px-4 pt-1'>
        <Button
          onClick={handleUpdate}
          disabled={isPending || name === session?.user?.name}
          className='h-12 w-full rounded-2xl bg-primary font-bold tracking-tight text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]'
        >
          {isPending ? (
            <>
              <LoaderCircle className='h-5 w-5 animate-spin' />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </section>
  )
}
