import { sql } from 'drizzle-orm'

import { BaseService } from './base.service'

export interface AdminKpis {
  totalUsers: number
  newUsersToday: number
  newUsersWeek: number
  totalCreditsPurchased: number
  totalCreditsConsumed: number
  totalCreditsOutstanding: number
  activationsToday: number
  completionsToday: number
  expirationsToday: number
  revenueTodayXaf: number
  revenueWeekXaf: number
  activeProviders: number
  unhealthyProviders: number
  refreshedAt: string
}

export class ReportService extends BaseService {
  constructor() {
    super({ prefix: 'report-service', db: true })
  }

  /**
   * Uses the `dashboard_kpis` materialized view (Rule 7).
   * Single-row pre-computed KPIs — refreshed every 60s by cron.
   * Fallback to live query if view doesn't exist.
   */
  async computeAdminKpis(): Promise<AdminKpis> {
    try {
      const [row] = await this.db.execute<{
        total_users: number
        new_users_today: number
        new_users_week: number
        total_credits_purchased: number
        total_credits_consumed: number
        total_credits_outstanding: number
        activations_today: number
        completions_today: number
        expirations_today: number
        revenue_today_xaf: number
        revenue_week_xaf: number
        active_providers: number
        unhealthy_providers: number
        refreshed_at: string
      }>(sql`SELECT * FROM dashboard_kpis`)

      if (row) {
        return {
          totalUsers: Number(row.total_users),
          newUsersToday: Number(row.new_users_today),
          newUsersWeek: Number(row.new_users_week),
          totalCreditsPurchased: Number(row.total_credits_purchased),
          totalCreditsConsumed: Number(row.total_credits_consumed),
          totalCreditsOutstanding: Number(row.total_credits_outstanding),
          activationsToday: Number(row.activations_today),
          completionsToday: Number(row.completions_today),
          expirationsToday: Number(row.expirations_today),
          revenueTodayXaf: Number(row.revenue_today_xaf),
          revenueWeekXaf: Number(row.revenue_week_xaf),
          activeProviders: Number(row.active_providers),
          unhealthyProviders: Number(row.unhealthy_providers),
          refreshedAt: String(row.refreshed_at),
        }
      }
    } catch {
      this.log.warn('materialized_view_unavailable', { view: 'dashboard_kpis' })
    }

    return this.computeLiveKpis()
  }

  private async computeLiveKpis(): Promise<AdminKpis> {
    const [usersResult, activationsResult, revenueResult, providersResult] = await Promise.all([
      this.db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE banned = false) AS total_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS new_today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_week
        FROM "user"
      `),
      this.db.execute(sql`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE state = 'completed') AS completed,
          COUNT(*) FILTER (WHERE state = 'expired') AS expired
        FROM sms_activation
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `),
      this.db.execute(sql`
        SELECT
          COALESCE(SUM(price_xaf) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) AS today,
          COALESCE(SUM(price_xaf) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0) AS week
        FROM credit_purchase
        WHERE status = 'credited'
      `),
      this.db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE is_active = true) AS active,
          COUNT(*) FILTER (WHERE is_active = true AND uptime_pct_30d < 95) AS unhealthy
        FROM provider
      `),
    ])

    const u = usersResult.rows[0] as Record<string, unknown>
    const a = activationsResult.rows[0] as Record<string, unknown>
    const r = revenueResult.rows[0] as Record<string, unknown>
    const p = providersResult.rows[0] as Record<string, unknown>

    return {
      totalUsers: Number(u.total_users),
      newUsersToday: Number(u.new_today),
      newUsersWeek: Number(u.new_week),
      totalCreditsPurchased: 0,
      totalCreditsConsumed: 0,
      totalCreditsOutstanding: 0,
      activationsToday: Number(a.total),
      completionsToday: Number(a.completed),
      expirationsToday: Number(a.expired),
      revenueTodayXaf: Number(r.today),
      revenueWeekXaf: Number(r.week),
      activeProviders: Number(p.active),
      unhealthyProviders: Number(p.unhealthy),
      refreshedAt: new Date().toISOString(),
    }
  }

  async getRevenueByDay(
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; revenueXaf: number }>> {
    const result = await this.db.execute(sql`
      SELECT
        DATE(credited_at) as day,
        COALESCE(SUM(price_xaf), 0) as revenue
      FROM credit_purchase
      WHERE status = 'credited'
        AND credited_at >= ${from}
        AND credited_at <= ${to}
      GROUP BY DATE(credited_at)
      ORDER BY day
    `)

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      date: String(row.day),
      revenueXaf: Number(row.revenue),
    }))
  }
}
