import { db } from '../src/database'
import { creditPurchase } from '../src/database/schema'
import { eq } from 'drizzle-orm'

async function main() {
    const id = process.argv[2]
    const purchase = await db.query.creditPurchase.findFirst({
        where: eq(creditPurchase.id, id)
    })
    console.log(JSON.stringify(purchase, null, 2))
}

main()
