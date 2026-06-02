'use client'

import { LogOut, LoaderCircle } from 'lucide-react'
import { Button } from '@/common/ui/button'
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
      <h2 className='px-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground'>
        Session
      </h2>

      <div className='overflow-hidden rounded-3xl p-1'>
        <Button
          onClick={handleLogout}
          disabled={isPending}
          variant='ghost'
          className='h-12 w-full justify-start gap-3 rounded-2xl px-4 font-bold text-destructive transition-all active:scale-[0.98]'
        >
          {isPending ? (
            <LoaderCircle className='h-5 w-5 animate-spin text-destructive' />
          ) : (
            <LogOut className='h-5 w-5' />
          )}
          <span>Log Out</span>
        </Button>
      </div>
    </section>
  )
}
