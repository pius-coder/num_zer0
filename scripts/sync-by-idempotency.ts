import { PaymentPurchaseService } from '../src/lib/economics/payment-purchase-service'

async function main() {
    const idempotencyId = process.argv[2]
    if (!idempotencyId) {
        console.log('\n❌ Usage: bun scripts/sync-by-idempotency.ts <idempotencyId>')
        console.log('   Example: bun scripts/sync-by-idempotency.ts purchase_1774625929454_7xpg81\n')
        process.exit(1)
    }

    console.log(`\n🚀 Processing Sync for Idempotency ID: ${idempotencyId}...`)

    try {
        const result = await PaymentPurchaseService.verifyAndSyncPurchase(idempotencyId)

        console.log('\n✅ SYNC SUCCESSFUL')
        console.log('--------------------------------------------------')
        console.log(`ID:        ${result.id}`)
        console.log(`Status:    ${result.status}`)
        console.log(`Credits:   ${result.totalCredits}`)
        console.log(`User ID:   ${result.userId}`)
        console.log(`Reference: ${result.paymentRef}`)
        console.log('--------------------------------------------------\n')

    } catch (error) {
        console.error('\n❌ SYNC FAILED')
        console.error('--------------------------------------------------')
        console.error(error instanceof Error ? error.message : error)
        console.error('--------------------------------------------------\n')
        process.exit(1)
    }
}

main()
