'use client'

import { authClient } from '#/lib/auth-client'
import { UserCircle, ShieldCheck, LoaderCircle } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/common/ui/button'
import { Separator } from '#/common/ui/separator'
import { Skeleton } from '#/common/ui/skeleton'
import { toastManager } from '#/common/ui/toast'


export function ProfileForm() {
  const sessionResult = authClient.useSession()
  const { data: session, isPending: isSessionLoading } = sessionResult
  const [name, setName] = useState(session?.user?.name ?? '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.name])

  const displayIdentifier = session?.user?.email ?? 'N/A'

  const handleUpdate = async () => {
    if (!name.trim()) {
      toastManager.add({ title: 'Erreur', description: 'Le nom ne peut pas être vide', type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        await authClient.updateUser({ name: name.trim() })
        toastManager.add({ title: 'Succès', description: 'Profil mis à jour', type: 'success' })
      } catch (err) {
        toastManager.add({
          title: 'Échec',
          description: err instanceof Error ? err.message : 'Impossible de mettre à jour le profil',
          type: 'error',
        })
      }
    })
  }

  if (isSessionLoading && !session) {
    return (
      <section className='space-y-3'>
        <Skeleton className='mx-4 h-4 w-32 rounded-full' />
        <div className='overflow-hidden rounded-3xl'>
          <div className='flex items-center gap-4 px-4 py-3.5'>
            <Skeleton className='h-10 w-10 shrink-0 rounded-2xl' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-3 w-16 rounded-full' />
              <Skeleton className='h-4 w-full rounded-full' />
            </div>
          </div>
          <Separator className='mx-4 w-auto' />
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
        Informations personnelles
      </h2>

      <div className='overflow-hidden rounded-3xl'>
        <div className='flex items-center gap-4 px-4 py-3.5'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary'>
            <UserCircle className='h-6 w-6' />
          </div>
          <div className='flex-1 space-y-0.5'>
            <label htmlFor='name' className='text-[12px] font-medium text-muted-foreground'>
              Nom complet
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Votre nom'
              className='w-full bg-transparent text-[15px] font-semibold text-foreground placeholder:text-muted-foreground outline-none'
            />
          </div>
        </div>

        <Separator className='mx-4 w-auto' />

        <div className='flex items-center gap-4 px-4 py-3.5 opacity-60'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground'>
            <ShieldCheck className='h-6 w-6' />
          </div>
          <div className='flex-1 space-y-0.5'>
            <span className='text-[12px] font-medium text-muted-foreground'>Identifiant</span>
            <p className='text-[15px] font-semibold text-foreground'>{displayIdentifier}</p>
          </div>
        </div>
      </div>

      <div className='px-4 pt-1'>
        <Button
          onClick={handleUpdate}
          disabled={isPending || name === session?.user?.name}
          className='h-12 w-full rounded-2xl font-bold tracking-tight transition-all active:scale-[0.98]'
        >
          {isPending ? (
            <>
              <LoaderCircle className='h-5 w-5 animate-spin' />
              Sauvegarde...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </section>
  )
}
