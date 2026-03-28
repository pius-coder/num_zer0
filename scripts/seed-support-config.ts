import { db } from '../src/database'
import { platformConfig } from '../src/database/schema'
import { eq } from 'drizzle-orm'

async function seed() {
    console.log('🌱 Seeding Support Config...')

    const configs = [
        {
            key: 'support_whatsapp',
            value: '237690000000',
            valueType: 'string',
            category: 'support',
            descriptionFr: 'Numéro WhatsApp pour le support client.',
            descriptionEn: 'WhatsApp number for customer support.'
        },
        {
            key: 'support_email',
            value: 'support@numzero.com',
            valueType: 'string',
            category: 'support',
            descriptionFr: 'Email de support client.',
            descriptionEn: 'Customer support email.'
        }
    ]

    for (const config of configs) {
        const existing = await db.query.platformConfig.findFirst({
            where: eq(platformConfig.key, config.key)
        })

        if (!existing) {
            await db.insert(platformConfig).values(config as any)
            console.log(`✅ Created ${config.key}`)
        } else {
            console.log(`ℹ️ ${config.key} already exists`)
        }
    }

    process.exit(0)
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
})
