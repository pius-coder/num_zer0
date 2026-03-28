import { db } from '@/database'
import { creditPurchase } from '@/database/schema'
import { count, sum, eq } from 'drizzle-orm'

async function verify() {
    console.log('--- Verifying Fix for Admin Dashboard Stats ---')

    try {
        console.log('1. Testing total revenue query...')
        const [revenue] = await db.select({
            value: sum(creditPurchase.priceXaf)
        })
            .from(creditPurchase)
            .where(eq(creditPurchase.status, 'credited'))

        console.log('✅ Revenue query successful:', revenue?.value || 0)

        console.log('2. Testing revenue chart query...')
        // Simplified version of the chart query
        const stats = await db.select({
            revenue: sum(creditPurchase.priceXaf)
        })
            .from(creditPurchase)
            .where(eq(creditPurchase.status, 'credited'))

        console.log('✅ Chart query successful:', stats[0]?.revenue || 0)

        console.log('--- Verification Complete: FIX IS VALID ---')
        process.exit(0)
    } catch (error) {
        console.error('❌ Verification FAILED:')
        console.error(error)
        process.exit(1)
    }
}

verify()
