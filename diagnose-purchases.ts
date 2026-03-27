import { db } from './src/database'
import { creditPackage, creditPurchase, user } from './src/database/schema'
import { PaymentPurchaseService } from './src/lib/economics/payment-purchase-service'
import { eq } from 'drizzle-orm'

async function test() {
    try {
        console.log('--- Diagnosis Start ---')

        // 1. Check if we have at least one user
        const firstUser = await db.query.user.findFirst()
        if (!firstUser) {
            console.error('No user found in DB')
            return
        }
        console.log('User found:', firstUser.id)

        // 2. Check active packages
        const packages = await db.query.creditPackage.findMany({
            where: eq(creditPackage.isActive, true)
        })
        console.log('Active packages count:', packages.length)
        if (packages.length === 0) {
            console.error('No active packages found in DB')
            return
        }

        const pack = packages[0]
        console.log('Testing with package:', pack.id, pack.nameFr)

        // 3. Try to create a purchase
        const idempotencyKey = `test_${Date.now()}`
        try {
            const purchase = await PaymentPurchaseService.createPendingPurchase({
                userId: firstUser.id,
                packageId: pack.id,
                paymentMethod: 'mtn_momo',
                idempotencyKey
            })
            console.log('Success! Purchase created:', purchase.id)
        } catch (err) {
            console.error('Failed to create purchase:', err)
        }

        console.log('--- Diagnosis End ---')
    } catch (err) {
        console.error('Global error:', err)
    }
}

test().then(() => process.exit(0))
