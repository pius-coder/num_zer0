'use client'

import { authClient } from '#/lib/auth-client'
import { UserCircle, ShieldCheck, LoaderCircle } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
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

  return (
    <section className='space-y-3'>
      <h2 className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
        Informations personnelles
      </h2>

      {isSessionLoading && !session ? (
        <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Chargement...</p>
      ) : (
        <>
          <div className='flex items-center gap-4 py-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center text-[var(--sea-ink)]'>
              <UserCircle className='h-6 w-6' />
            </div>
            <div className='flex-1 space-y-0.5'>
              <label htmlFor='name' className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
                Nom complet
              </label>
              <input
                id='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Votre nom'
                className='w-full bg-transparent font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none'
              />
            </div>
          </div>

          <div className='flex items-center gap-4 py-3 opacity-60'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center text-[var(--sea-ink-soft)]'>
              <ShieldCheck className='h-6 w-6' />
            </div>
            <div className='flex-1 space-y-0.5'>
              <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Identifiant</span>
              <p className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]'>{displayIdentifier}</p>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={isPending || name === session?.user?.name}
            className='w-full py-3 font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer disabled:opacity-40'
          >
            {isPending ? (
              <>
                <LoaderCircle className='h-5 w-5 animate-spin inline mr-2' />
                Sauvegarde...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </>
      )}
    </section>
  )
}
