import { db } from '../src/database'
import { platformConfig } from '../src/database/schema'
import { eq } from 'drizzle-orm'

async function seed() {
    console.log('🌱 Seeding Fapshi Config...')

    const key = 'fapshi_confirmation_email'
    const value = 'myuser@email.com'
    const valueType = 'string'
    const category = 'economics'

    const existing = await db.query.platformConfig.findFirst({
        where: eq(platformConfig.key, key)
    })

    if (!existing) {
        await db.insert(platformConfig).values({
            key,
            value,
            valueType,
            category,
            descriptionFr: 'Email de confirmation envoyé à Fapshi pour les reçus.',
            descriptionEn: 'Confirmation email sent to Fapshi for receipts.'
        })
        console.log('✅ Created fapshi_confirmation_email')
    } else {
        console.log('ℹ️ fapshi_confirmation_email already exists')
    }

    process.exit(0)
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
})
