import { createFapshiClientFromEnv } from '../src/lib/fapshi'

async function main() {
    console.log('🚀 Testing Fapshi SDK...')

    try {
        const client = createFapshiClientFromEnv()

        console.log('\n--- Testing Initiate Pay ---')
        const initRes = await client.initiatePay({
            amount: 500,
            externalId: `test_${Date.now()}`,
            userId: 'test_user_123',
            message: 'Test payment from ShipFree SDK',
        })

        console.log('✅ Payment Link Generated:')
        console.log(`   Link: ${initRes.link}`)
        console.log(`   TransId: ${initRes.transId}`)

        console.log('\n--- Testing Payment Status ---')
        const statusRes = await client.paymentStatus(initRes.transId)
        console.log('✅ Status Retrieved:')
        console.log(`   Status: ${statusRes.status}`)
        console.log(`   Amount: ${statusRes.amount} XAF`)

    } catch (error) {
        console.error('\n❌ Test Failed:')
        console.error(error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

main()
