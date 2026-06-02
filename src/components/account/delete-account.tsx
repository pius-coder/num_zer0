'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/common/ui/button'
import { toastManager } from '#/common/ui/toast'
import { authClient } from '#/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
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
} from '#/common/ui/dialog'

export function DeleteAccount() {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await authClient.deleteUser()
        toastManager.add({
          title: 'Compte supprimé',
          description: 'Votre compte a été supprimé définitivement.',
          type: 'success',
        })
        await authClient.signOut()
        router.navigate({ to: '/' })
      } catch (err) {
        toastManager.add({
          title: 'Échec',
          description: 'Impossible de supprimer votre compte.',
          type: 'error',
        })
      }
    })
  }

  return (
    <section className='space-y-3'>
      <h3 className='px-4 text-[13px] font-semibold uppercase tracking-wider text-destructive/80'>
        Zone dangereuse
      </h3>

      <div className='overflow-hidden rounded-3xl p-5'>
        <div className='flex gap-4'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-destructive'>
            <AlertTriangle className='h-6 w-6' />
          </div>
          <div className='space-y-1'>
            <p className='text-[15px] font-bold tracking-tight text-destructive'>Supprimer le compte</p>
            <p className='text-[13px] leading-relaxed text-muted-foreground'>
              Supprimer définitivement votre compte et toutes les données associées.
            </p>
          </div>
        </div>

        <div className='mt-6'>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button
                  variant='destructive'
                  className='h-12 w-full rounded-2xl font-bold tracking-tight transition-all active:scale-[0.98]'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Supprimer mon compte
                </Button>
              }
            />

            <DialogPopup className='max-w-md'>
              <DialogHeader className='pt-8 text-center items-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-3xl text-destructive mb-2'>
                  <AlertTriangle className='h-8 w-8' />
                </div>
                <DialogTitle className='text-2xl font-bold tracking-tight text-foreground'>
                  Êtes-vous sûr ?
                </DialogTitle>
                <DialogDescription className='text-muted-foreground mt-2 px-6'>
                  Cette action est irréversible. Toutes vos données seront perdues.
                </DialogDescription>
              </DialogHeader>

              <div className='px-6 py-8'>
                {isPending ? (
                  <div className='flex h-14 items-center justify-center gap-2 rounded-2xl text-muted-foreground'>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <span className='text-sm font-medium'>Suppression...</span>
                  </div>
                ) : (
                  <SwipeToDelete onConfirm={handleDelete} disabled={isPending} />
                )}
              </div>

              <DialogFooter variant='bare' className='px-6 pb-8 pt-0'>
                <DialogClose>
                  <Button
                    variant='ghost'
                    className='h-11 w-full rounded-xl font-semibold text-muted-foreground transition-colors'
                    disabled={isPending}
                  >
                    Annuler
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
