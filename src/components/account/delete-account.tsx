'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
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
      <h3 className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
        Zone dangereuse
      </h3>

      <div className='py-3'>
        <div className='flex gap-4'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center text-[var(--sea-ink)]'>
            <AlertTriangle className='h-6 w-6' />
          </div>
          <div className='space-y-1'>
            <p className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]'>Supprimer le compte</p>
            <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
              Supprimer définitivement votre compte et toutes les données associées.
            </p>
          </div>
        </div>

        <div className='mt-6'>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <button className='w-full py-3 font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer'>
                  <Trash2 className='mr-2 h-4 w-4 inline' />
                  Supprimer mon compte
                </button>
              }
            />

            <DialogPopup className='max-w-md'>
              <DialogHeader className='pt-8 text-center items-center'>
                <div className='flex h-16 w-16 items-center justify-center text-[var(--sea-ink)] mb-2'>
                  <AlertTriangle className='h-8 w-8' />
                </div>
                <DialogTitle>
                  Êtes-vous sûr ?
                </DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Toutes vos données seront perdues.
                </DialogDescription>
              </DialogHeader>

              <div className='px-6 py-8'>
                {isPending ? (
                  <div className='flex h-14 items-center justify-center gap-2'>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Suppression...</span>
                  </div>
                ) : (
                  <SwipeToDelete onConfirm={handleDelete} disabled={isPending} />
                )}
              </div>

              <DialogFooter variant='bare' className='px-6 pb-8 pt-0'>
                <DialogClose>
                  <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer'>
                    Annuler
                  </span>
                </DialogClose>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
