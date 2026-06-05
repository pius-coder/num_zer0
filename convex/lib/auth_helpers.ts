import type { QueryCtx, MutationCtx } from '../_generated/server'

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  return identity
}

export async function requireAdmin(ctx: MutationCtx) {
  const identity = await requireAuth(ctx)
  const user = await ctx.db
    .query('users')
    .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
    .unique()
  if (!user?.isAdmin) throw new Error('Unauthorized: admin access required')
  return { identity, user }
}
