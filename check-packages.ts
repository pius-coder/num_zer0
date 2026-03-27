import { db } from './src/database'
import { creditPackage } from './src/database/schema'
import postgres from 'postgres'

async function check() {
    try {
        const packages = await db.query.creditPackage.findMany()
        console.log('Total packages in DB:', packages.length)
        packages.forEach(p => {
            console.log(`- [${p.id}] ${p.nameFr} (Active: ${p.isActive})`)
        })
    } catch (err) {
        console.error('Error fetching packages:', err)
    }
}

check().then(() => process.exit(0))
