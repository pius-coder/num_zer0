import { createFapshiClientFromEnv } from '../src/lib/fapshi'

async function main() {
    const id = process.argv[2]
    if (!id) {
        console.error('Usage: bun scripts/check-status.ts <transId>')
        process.exit(1)
    }

    try {
        const client = createFapshiClientFromEnv()
        const status = await client.paymentStatus(id)
        console.log(JSON.stringify(status, null, 2))
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

main()
