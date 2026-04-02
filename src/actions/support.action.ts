'use server'

import { auth } from '@/common/auth'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { headers } from 'next/headers'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { supportMessages, platformConfig } from '@/database/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

const log = createLogger({ prefix: 'support-action' })

export interface SupportActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

const SendMessageSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

export async function sendSupportMessageAction(
  input: z.infer<typeof SendMessageSchema>
): Promise<SupportActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    log.warn('support_send_unauthorized')
    return { success: false, error: 'unauthorized' }
  }

  log.info('support_send_started', { userId: session.user.id, subject: input.subject })

  try {
    const parsed = SendMessageSchema.parse(input)
    const id = `msg_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
    await db.insert(supportMessages).values({
      id,
      userId: session.user.id,
      direction: 'user_to_admin',
      subject: parsed.subject,
      content: parsed.content,
      isRead: false,
    })
    log.info('support_send_complete', { messageId: id, userId: session.user.id })
    return { success: true }
  } catch (error) {
    log.error('support_send_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: error instanceof Error ? error.message : 'send_failed' }
  }
}

export async function getMySupportMessagesAction(): Promise<
  SupportActionResult<
    Array<{
      id: string
      subject: string | null
      content: string
      direction: string
      isRead: boolean
      createdAt: Date
    }>
  >
> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    log.warn('support_get_unauthorized')
    return { success: false, error: 'unauthorized' }
  }

  try {
    const messages = await db
      .select({
        id: supportMessages.id,
        subject: supportMessages.subject,
        content: supportMessages.content,
        direction: supportMessages.direction,
        isRead: supportMessages.isRead,
        createdAt: supportMessages.createdAt,
      })
      .from(supportMessages)
      .where(eq(supportMessages.userId, session.user.id))
      .orderBy(desc(supportMessages.createdAt))
      .limit(50)
    return { success: true, data: messages }
  } catch (error) {
    log.error('support_get_messages_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'fetch_failed' }
  }
}

let cachedConfig: { whatsapp?: string; email?: string } | null = null
let lastFetch = 0
const CACHE_TTL = 300_000

export async function getPublicSupportConfigAction(): Promise<
  SupportActionResult<{ whatsapp?: string; email?: string }>
> {
  const now = Date.now()
  if (cachedConfig && now - lastFetch < CACHE_TTL) {
    return { success: true, data: cachedConfig }
  }

  try {
    const rows = await db
      .select({ key: platformConfig.key, value: platformConfig.value })
      .from(platformConfig)
      .where(eq(platformConfig.key, 'support_whatsapp').or(eq(platformConfig.key, 'support_email')))

    const config: { whatsapp?: string; email?: string } = {}
    for (const row of rows) {
      if (row.key === 'support_whatsapp') config.whatsapp = row.value
      if (row.key === 'support_email') config.email = row.value
    }

    cachedConfig = config
    lastFetch = now
    return { success: true, data: cachedConfig }
  } catch (error) {
    log.error('support_config_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'config_unavailable' }
  }
}

export async function getAllSupportMessagesAction(): Promise<
  SupportActionResult<
    Array<{
      id: string
      userId: string
      adminId: string | null
      direction: string
      subject: string | null
      content: string
      isRead: boolean
      createdAt: Date
    }>
  >
> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const messages = await db
      .select({
        id: supportMessages.id,
        userId: supportMessages.userId,
        adminId: supportMessages.adminId,
        direction: supportMessages.direction,
        subject: supportMessages.subject,
        content: supportMessages.content,
        isRead: supportMessages.isRead,
        createdAt: supportMessages.createdAt,
      })
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt))
      .limit(200)
    return { success: true, data: messages }
  } catch (error) {
    log.error('support_admin_get_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'fetch_failed' }
  }
}

const ReplySchema = z.object({
  messageId: z.string().min(1),
  content: z.string().min(1, 'Reply is required').max(5000),
})

export async function replyToSupportMessageAction(
  input: z.infer<typeof ReplySchema>
): Promise<SupportActionResult> {
  let adminSession
  try {
    adminSession = await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const parsed = ReplySchema.parse(input)

    const original = await db.query.supportMessages.findFirst({
      where: eq(supportMessages.id, parsed.messageId),
    })
    if (!original) {
      return { success: false, error: 'message_not_found' }
    }

    const replyId = `msg_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
    await db.insert(supportMessages).values({
      id: replyId,
      userId: original.userId,
      adminId: adminSession.user.id,
      direction: 'admin_to_user',
      subject: original.subject ? `Re: ${original.subject}` : null,
      content: parsed.content,
      isRead: false,
    })

    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(eq(supportMessages.id, parsed.messageId))

    log.info('support_replied', { messageId: parsed.messageId, adminId: adminSession.user.id })
    return { success: true }
  } catch (error) {
    log.error('support_reply_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: error instanceof Error ? error.message : 'reply_failed' }
  }
}
