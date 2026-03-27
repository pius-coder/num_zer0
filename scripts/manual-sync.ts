import { PaymentPurchaseService } from '../src/lib/economics/payment-purchase-service'

async function main() {
    const id = process.argv[2]
    if (!id) {
        console.error('Usage: bun scripts/manual-sync.ts <purchaseIdOrRef>')
        process.exit(1)
    }

    console.log(`🚀 Manually syncing transaction: ${id}...`)

    try {
        const result = await PaymentPurchaseService.verifyAndSyncPurchase(id)
        console.log('✅ Success!')
        console.log(JSON.stringify(result, null, 2))
    } catch (error) {
        console.error('❌ Sync failed:')
        console.error(error)
        process.exit(1)
    }
}

main()
