'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/component/ui/button'
import { toastManager } from '@/component/ui/toast'
import { deleteAccountAction } from '@/actions/user.action'
import { signOut } from '@/common/auth/auth-client'
import { useRouter } from 'next/navigation'
import { SwipeToDelete } from './swipe-to-delete'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/component/ui/dialog'

export function DeleteAccount({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteAccountAction()
        if (result.success) {
          toastManager.add({
            title: 'Account Deleted',
            description: 'Your account has been permanently removed.',
            type: 'success',
          })
          await signOut()
          router.push(`/${locale}/login`)
        } else {
          throw new Error(result.error || 'Failed to delete account')
        }
      } catch (err) {
        toastManager.add({
          title: 'Deletion failed',
          description: 'Could not delete your account. Please try again.',
          type: 'error',
        })
      }
    })
  }

  return (
    <section className='space-y-3'>
      <h3 className='px-4 text-[13px] font-semibold uppercase tracking-wider text-destructive/80'>
        Danger Zone
      </h3>

      <div className='overflow-hidden rounded-3xl border border-destructive/10 bg-destructive/[0.02] p-5 shadow-xl shadow-destructive/20'>
        <div className='flex gap-4'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
            <AlertTriangle className='h-6 w-6' />
          </div>
          <div className='space-y-1'>
            <p className='text-[15px] font-bold tracking-tight text-destructive'>Delete Account</p>
            <p className='text-[13px] leading-relaxed text-muted-foreground'>
              Permanently remove your account and all associated data. This action is irreversible.
            </p>
          </div>
        </div>

        <div className='mt-6'>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button
                  variant='destructive'
                  className='h-12 w-full rounded-2xl bg-destructive font-bold tracking-tight text-destructive-foreground transition-all active:scale-[0.98] hover:bg-destructive/90'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete My Account
                </Button>
              }
            />

            <DialogPopup className='max-w-md border-destructive/20 bg-background shadow-2xl shadow-destructive/10'>
              <DialogHeader className='pt-8 text-center items-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-2'>
                  <AlertTriangle className='h-8 w-8' />
                </div>
                <DialogTitle className='text-2xl font-bold tracking-tight text-foreground'>
                  Are you absolutely sure?
                </DialogTitle>
                <DialogDescription className='text-muted-foreground mt-2 px-6'>
                  This action cannot be undone. All your numbers, orders, and wallet balance will be
                  permanently lost.
                </DialogDescription>
              </DialogHeader>

              <div className='px-6 py-8'>
                {isPending ? (
                  <div className='flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-black text-muted-foreground'>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <span className='text-sm font-medium'>Deleting account...</span>
                  </div>
                ) : (
                  <SwipeToDelete onConfirm={handleDelete} disabled={isPending} />
                )}
              </div>

              <DialogFooter variant='bare' className='px-6 pb-8 pt-0'>
                <DialogClose>
                  <Button
                    variant='ghost'
                    className='h-11 w-full rounded-xl font-semibold text-muted-foreground hover:bg-accent transition-colors'
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
