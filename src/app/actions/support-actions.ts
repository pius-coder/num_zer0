'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import { db } from '@/database'
import { supportMessages } from '@/database/schema'
import { createLogger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

const log = createLogger({ prefix: 'support-actions' })

const messageSchema = z.object({
    subject: z.string().optional(),
    content: z.string().min(1, 'Message requis'),
})

/**
 * Sends a message from user to admin
 */
export async function sendSupportMessage(input: z.infer<typeof messageSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user) {
        throw new Error('Non autorisé')
    }

    const payload = messageSchema.parse(input)
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    await db.insert(supportMessages).values({
        id: messageId,
        userId: session.user.id,
        direction: 'user_to_admin',
        subject: payload.subject || 'Support Request',
        content: payload.content,
        isRead: false,
    })

    log.info('support_message_sent', { userId: session.user.id, messageId })
    revalidatePath('/admin/messages') // For future admin view

    return { success: true }
}

/**
 * Retrieves support messages for the current user
 */
export async function getMySupportMessages() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session?.user) return []

    return db.query.supportMessages.findMany({
        where: (msg, { eq }) => eq(msg.userId, session.user.id),
        orderBy: (msg, { desc }) => [desc(msg.createdAt)],
    })
}

let cachedConfig: { whatsapp: string | null; email: string | null } | null = null
let lastFetch = 0
const CACHE_TTL = 300000 // 5 minutes

/**
 * Retrieves public support configuration (WhatsApp, Email)
 */
export async function getPublicSupportConfig() {
    const now = Date.now()
    if (cachedConfig && (now - lastFetch < CACHE_TTL)) {
        return cachedConfig
    }

    const { getEconomicsConfigString } = await import('@/lib/economics/config-service')

    const whatsapp = await getEconomicsConfigString('support_whatsapp')
    const email = await getEconomicsConfigString('support_email')

    cachedConfig = {
        whatsapp: whatsapp || null,
        email: email || null,
    }
    lastFetch = now

    return cachedConfig
}

/**
 * Retrieves all messages (Admin Only)
 */
export async function getAllSupportMessages() {
    const { requireAdminSession } = await import('@/lib/auth/require-admin')
    await requireAdminSession()

    return db.query.supportMessages.findMany({
        with: {
            user: true,
        },
        orderBy: (msg, { desc }) => [desc(msg.createdAt)],
    })
}

/**
 * Replies to a support message (Admin Only)
 */
export async function replyToSupportMessage(input: { messageId: string; content: string }) {
    const { requireAdminSession } = await import('@/lib/auth/require-admin')
    const session = await requireAdminSession()

    // Get original message to find userId
    const original = await db.query.supportMessages.findFirst({
        where: (msg, { eq }) => eq(msg.id, input.messageId),
    })

    if (!original) throw new Error('Message non trouvé')

    const replyId = `msg_reply_${Date.now()}`

    await db.insert(supportMessages).values({
        id: replyId,
        userId: original.userId,
        adminId: session.user.id,
        direction: 'admin_to_user',
        subject: `Re: ${original.subject}`,
        content: input.content,
        isRead: false,
    })

    log.info('support_reply_sent', { adminId: session.user.id, userId: original.userId })
    revalidatePath('/admin/messages')

    return { success: true }
}

/**
 * Marks a message as read
 */
export async function markAsRead(messageId: string) {
    const { eq } = await import('drizzle-orm')
    await db.update(supportMessages).set({ isRead: true }).where(eq(supportMessages.id, messageId))
    revalidatePath('/admin/messages')
    return { success: true }
}
