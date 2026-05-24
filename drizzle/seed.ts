import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { hash } from 'bcryptjs'
import * as schema from '../src/database/schema'
import { env } from '../src/config/env'

async function main() {
  const queryClient = postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 20,
    fetch_types: true,
    prepare: false,
  })

  const db = drizzle({ client: queryClient, schema })

  const phone = '+237650000000'
  const email = 'admin@numzero.com'
  const password = 'admin123'
  const hashedPassword = await hash(password, 10)

  const existingUser = await db.select()
    .from(schema.user)
    .where(eq(schema.user.phoneNumber, phone))
    .limit(1)

  if (existingUser.length > 0) {
    console.log('Utilisateur déjà existant:', existingUser[0].phoneNumber)
    console.log('   Téléphone:', phone)
    console.log('   Email:', email)
    console.log('   Mot de passe:', password)
    await queryClient.end()
    return
  }

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const walletId = crypto.randomUUID()

  await db.insert(schema.user).values({
    id: userId,
    name: 'Admin',
    email,
    emailVerified: true,
    phoneNumber: phone,
    phoneNumberVerified: true,
    role: 'admin',
    username: 'admin',
    displayUsername: 'Admin',
    referralCode: 'ADMIN2024',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(schema.account).values({
    id: accountId,
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(schema.creditWallet).values({
    id: walletId,
    userId,
    baseBalance: 1000,
    bonusBalance: 500,
    totalPurchased: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log('✅ Utilisateur créé avec succès !')
  console.log('   Téléphone:', phone)
  console.log('   Email:', email)
  console.log('   Mot de passe:', password)
  console.log('   Rôle: admin')
  console.log('   Crédits: 1500 (1000 base + 500 bonus)')

  await queryClient.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
