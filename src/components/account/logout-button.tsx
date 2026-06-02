'use client'

import { LogOut, LoaderCircle } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { useState } from 'react'

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/login'
          },
        },
      })
    } catch (error) {
      console.error('Logout failed', error)
      setIsPending(false)
    }
  }

  return (
    <section className='space-y-3'>
      <h2 className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
        Session
      </h2>

      <button
        onClick={handleLogout}
        disabled={isPending}
        className='w-full flex items-center gap-3 py-3 font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer disabled:opacity-40'
      >
        {isPending ? (
          <LoaderCircle className='h-5 w-5 animate-spin' />
        ) : (
          <LogOut className='h-5 w-5' />
        )}
        <span>Log Out</span>
      </button>
    </section>
  )
}
