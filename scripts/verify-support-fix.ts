import { db } from '@/database'
import { supportMessages } from '@/database/schema'
import { count, eq, and } from 'drizzle-orm'

async function verify() {
    console.log('--- Verifying support_messages table ---')

    try {
        console.log('1. Testing support_messages count query...')
        const [unreadMessages] = await db.select({ value: count() })
            .from(supportMessages)
            .where(and(eq(supportMessages.isRead, false), eq(supportMessages.direction, 'user_to_admin')))

        console.log('✅ support_messages query successful. Unread count:', unreadMessages?.value || 0)

        console.log('2. Testing getAllSupportMessages (Admin Action)...')
        const { getAllSupportMessages } = await import('@/app/actions/support-actions')
        const messages = await getAllSupportMessages()
        console.log('✅ getAllSupportMessages successful. Total messages:', messages.length)

        console.log('--- Verification Complete: FIX IS VALID ---')
        process.exit(0)
    } catch (error) {
        console.error('❌ Verification FAILED:')
        console.error(error)
        process.exit(1)
    }
}

verify()
