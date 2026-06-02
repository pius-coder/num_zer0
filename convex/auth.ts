import { betterAuth } from 'better-auth/minimal'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { anonymous } from 'better-auth/plugins/anonymous'
import authConfig from './auth.config'
import { components, api } from './_generated/api'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

const siteUrl = process.env.SITE_URL!

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const syncUserDb = async (user: any) => {
    const now = Date.now()
    const isAnonymous = !!user.isAnonymous
    const accessExpiresAt = isAnonymous ? now + 48 * 60 * 60 * 1000 : undefined

    if ('db' in ctx) {
      const db = (ctx as any).db
      const existing = await db
        .query('users')
        .withIndex('by_betterAuthUserId', (q: any) =>
          q.eq('betterAuthUserId', user.id)
        )
        .unique()

      const usersCount = (await db.query('users').collect()).length
      const isAdmin = user.email?.endsWith('@numzero.com') || user.email === 'admin@gmail.com' || usersCount === 0 || false

      if (existing) {
        const isConverted = existing.isAnonymous && !isAnonymous
        await db.patch(existing._id, {
          email: user.email || existing.email,
          name: user.name || existing.name,
          isAnonymous,
          accessExpiresAt: isAnonymous ? (existing.accessExpiresAt || accessExpiresAt) : undefined,
          convertedAt: isConverted ? now : existing.convertedAt,
          isAdmin: existing.isAdmin ?? isAdmin,
          updatedAt: now,
        })
      } else {
        await db.insert('users', {
          betterAuthUserId: user.id,
          email: user.email || undefined,
          name: user.name || undefined,
          isAnonymous,
          accessExpiresAt,
          balanceUsd: 0,
          isAdmin,
          createdAt: now,
          updatedAt: now,
        })
      }
    } else if ('runMutation' in ctx) {
      await (ctx as any).runMutation(api.users.syncUser, {
        betterAuthUserId: user.id,
        email: user.email || undefined,
        name: user.name || undefined,
        isAnonymous,
        accessExpiresAt,
      })
    }
  }

  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: [
          'x-forwarded-for',
          'x-real-ip',
          'cf-connecting-ip',
          'x-client-ip',
        ],
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user: any) => {
            await syncUserDb(user)
          },
        },
        update: {
          after: async (user: any) => {
            await syncUserDb(user)
          },
        },
      },
    },
    plugins: [
      convex({ authConfig }),
      anonymous({
        emailDomainName: 'numzer0.app',
      }),
    ],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx)
  },
})
