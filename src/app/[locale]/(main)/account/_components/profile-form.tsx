"use client"

import { useSession } from '@/lib/auth/auth-client'
import { UserCircle, ShieldCheck } from 'lucide-react'
import { emailToPhone } from '@/lib/auth/phone-utils'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toastManager } from '@/components/ui/toast'
import { client } from '@/lib/auth/auth-client'
import { clientLogger } from '@/lib/logger/client-logger'
import { updateUserAction } from '@/app/actions/user-actions'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfileForm() {
    const { data: session, refetch, isPending: isSessionLoading } = useSession()
    const [name, setName] = useState(session?.user?.name ?? '')
    const [isPending, startTransition] = useTransition()

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
                clientLogger.error('Unhandled profile update error', err instanceof Error ? err : { message: String(err) })
                console.error(err)
                toastManager.add({
                    title: 'Update failed',
                    description: err instanceof Error ? err.message : 'Could not update profile. Please try again.',
                    type: 'error',
                })
            }
        })
    }

    if (isSessionLoading && !session) {
        return (
            <section className="space-y-3">
                <Skeleton className="mx-4 h-4 w-32 rounded-full" />
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/20">
                    <div className="flex items-center gap-4 px-4 py-3.5">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-16 rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                        </div>
                    </div>
                    <Separator className="mx-4 w-auto bg-border/50" />
                    <div className="flex items-center gap-4 px-4 py-3.5 opacity-60">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-4 w-32 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="px-4 pt-1">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </section>
        )
    }

    return (
        <section className="space-y-3">
            <h2 className="px-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
                Personal Information
            </h2>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/20">
                {/* Name Input Group */}
                <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                        <label htmlFor="name" className="text-[12px] font-medium text-muted-foreground">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-transparent text-[15px] font-semibold text-zinc-100 placeholder:text-zinc-700 outline-none"
                        />
                    </div>
                </div>

                <Separator className="mx-4 w-auto bg-border/50" />

                {/* Email Display (Read only in this view) */}
                <div className="flex items-center gap-4 px-4 py-3.5 opacity-60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/10 text-muted-foreground">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                        <label className="text-[12px] font-medium text-muted-foreground">
                            Identifier (Phone)
                        </label>
                        <p className="text-[15px] font-semibold text-foreground">
                            {displayIdentifier}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-1">
                <Button
                    onClick={handleUpdate}
                    disabled={isPending || name === session?.user?.name}
                    loading={isPending}
                    className="h-12 w-full rounded-2xl bg-primary font-bold tracking-tight text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                    Save Changes
                </Button>
            </div>
        </section>
    )
}
