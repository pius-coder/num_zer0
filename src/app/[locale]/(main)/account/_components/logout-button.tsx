'use client'

import { LogOut, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/auth-client'
import { useState } from 'react'

export function LogoutButton({ locale }: { locale: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleLogout = async () => {
        setIsPending(true)
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = `/${locale}/login`
                    }
                }
            })
        } catch (error) {
            console.error('Logout failed', error)
            setIsPending(false)
        }
    }

    return (
        <section className="space-y-3">
            <h2 className="px-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                Session
            </h2>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/20 p-1">
                <Button
                    onClick={handleLogout}
                    disabled={isPending}
                    variant="ghost"
                    className="h-12 w-full justify-start gap-3 rounded-2xl px-4 font-bold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-[0.98]"
                >
                    {isPending ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-red-400" />
                    ) : (
                        <LogOut className="h-5 w-5" />
                    )}
                    <span>Log Out</span>
                </Button>
            </div>
        </section>
    )
}
