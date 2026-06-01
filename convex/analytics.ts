import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const trackEvent = mutation({
  args: {
    eventType: v.string(),
    sessionId: v.string(),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('analytics_events', {
      eventType: args.eventType,
      sessionId: args.sessionId,
      country: args.country,
      device: args.device,
      durationMs: args.durationMs,
      timestamp: Date.now(),
    })
  },
})

export const getAnalyticsSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Non authentifié')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    if (!user || !user.isAdmin) {
      throw new Error('Non autorisé — Administrateur uniquement')
    }

    const allEvents = await ctx.db.query('analytics_events').collect()

    // Aggregate statistics
    const totalEvents = allEvents.length
    const sessions = new Set(allEvents.map((e) => e.sessionId))
    const totalSessions = sessions.size

    // Clicks
    const clickBuy = allEvents.filter((e) => e.eventType === 'click_buy').length
    const clickServices = allEvents.filter(
      (e) => e.eventType === 'click_services'
    ).length

    // Session durations (from page_leave)
    const leaveEvents = allEvents.filter(
      (e) => e.eventType === 'page_leave' && e.durationMs !== undefined
    )
    const totalDuration = leaveEvents.reduce(
      (acc, curr) => acc + (curr.durationMs || 0),
      0
    )
    const avgDurationSeconds =
      leaveEvents.length > 0
        ? Math.round(totalDuration / leaveEvents.length / 1000)
        : 0

    // Grouped by country
    const countryCount: Record<string, number> = {}
    allEvents.forEach((e) => {
      if (e.country) {
        countryCount[e.country] = (countryCount[e.country] || 0) + 1
      }
    })

    // Grouped by device
    const deviceCount: Record<string, number> = {}
    allEvents.forEach((e) => {
      if (e.device) {
        deviceCount[e.device] = (deviceCount[e.device] || 0) + 1
      }
    })

    // Sort events by timestamp desc for recent activity list
    const sortedEvents = [...allEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)

    return {
      totalSessions,
      totalEvents,
      clickBuy,
      clickServices,
      avgDurationSeconds,
      countryCount,
      deviceCount,
      recentEvents: sortedEvents,
    }
  },
})
