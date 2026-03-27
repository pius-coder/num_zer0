'use server'

import { auth } from '@/lib/auth'
import { db } from '@/database'
import { user as userTable } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createModuleLogger } from '@/lib/logger'

const logger = createModuleLogger('user-actions')

/**
 * Server action to delete the current user's account.
 * This handles deleting the user record from the database.
 * Drizzle schema is configured with `onDelete: 'cascade'` for sessions and accounts.
 */
export async function deleteAccountAction() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session || !session.user) {
        throw new Error('Unauthorized')
    }

    const userId = session.user.id

    try {
        // Delete the user from the database. 
        // Cascade delete will handle sessions, accounts, and other related data.
        await db.delete(userTable).where(eq(userTable.id, userId))

        // Better-auth might still have some cached state or server-side cookies.
        // The user should be redirected after this to clear client-side state.

        return { success: true }
    } catch (error) {
        console.error('Failed to delete account:', error)
        return { success: false, error: 'Failed to delete account' }
    }
}

/**
 * Server action to update user profile information.
 * Note: Better-Auth client-side `updateUser` is often preferred for immediate session refresh,
 * but this is useful for backend-only updates or complex logic.
 */
export async function updateUserAction(values: { name?: string; image?: string }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session || !session.user) {
        throw new Error('Unauthorized')
    }

    logger.info('Initiating updateUserAction', { values })
    try {
        await db
            .update(userTable)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(userTable.id, session.user.id))

        logger.info('User updated successfully', { userId: session.user.id })
        revalidatePath('/[locale]/(main)/account', 'page')
        return { success: true }
    } catch (error) {
        logger.error('Failed to update user', error instanceof Error ? error : { message: String(error) })
        console.error('Failed to update user:', error)
        return { success: false, error: 'Failed to update user' }
    }
}
