'use client'

import {
  Activity,
  CreditCard,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Settings,
  History,
  Clock
} from 'lucide-react'
import { AdminPageShell } from '../_components/admin-page-shell'
import { useAdminDashboardStats, useAdminRevenueChartData } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ChartTooltip({ active, payload, label, locale }: any) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-white/10 bg-card/90 backdrop-blur-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[180px]">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1 border-b border-white/5 pb-2">
        {new Date(label).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 border border-black/50"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10px] font-bold uppercase tracking-tight text-white/70">
                {entry.dataKey === 'credited' ? 'Success' : entry.dataKey === 'pending' ? 'Pending' : 'Failed'}
              </span>
            </div>
            <span className="text-xs font-black tabular-nums text-white">
              {Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SquareDot(props: any) {
  const { cx, cy, stroke, payload, value } = props
  return (
    <rect
      x={cx - 3}
      y={cy - 3}
      width={6}
      height={6}
      fill={stroke}
      stroke="#000"
      strokeWidth={1}
    />
  )
}

function ChartActiveDot(props: any) {
  const { cx, cy, stroke, payload, value } = props
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="var(--primary)" fillOpacity={0.15} className="animate-pulse" />
      <circle cx={cx} cy={cy} r={4} fill="var(--primary)" stroke="#000" strokeWidth={1} />
    </g>
  )
}

function KPICard({
  label,
  value,
  icon: Icon,
  loading,
  description,
  trend,
  color = "primary"
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  description?: string
  trend?: string
  color?: "primary" | "destructive" | "warning" | "success"
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    success: "text-emerald-500 bg-emerald-500/10"
  }

  return (
    <Card className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <div className={cn("p-2 rounded-xl", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted mt-1" />
        ) : (
          <div className="flex flex-col">
            <div className="text-2xl font-black tabular-nums tracking-tight">{value}</div>
            {description && (
              <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">
                {description}
              </p>
            )}
            {trend && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const params = useParams()
  const locale = params.locale as string
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useAdminRevenueChartData()

  return (
    <AdminPageShell
      title="Dashboard"
      subtitle="Vue d'ensemble des indicateurs de performance, de la santé du système et des actions requises."
    >
      {/* 1. Headline Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Chiffre d'Affaires"
          value={stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} XAF` : '0 XAF'}
          icon={CreditCard}
          loading={statsLoading}
          color="success"
          description="Volume total des achats réussis"
        />
        <KPICard
          label="Utilisateurs"
          value={stats?.totalUsers?.toLocaleString() ?? '—'}
          icon={Users}
          loading={statsLoading}
          description="Base totale d'utilisateurs actifs"
        />
        <KPICard
          label="Achats en Attente"
          value={stats?.pendingPurchases?.toLocaleString() ?? '0'}
          icon={Clock}
          loading={statsLoading}
          color="warning"
          description="Transactions en attente de synchronisation"
        />
        <KPICard
          label="Alertes Fraude"
          value={stats?.unresolvedFraud?.toLocaleString() ?? '0'}
          icon={ShieldAlert}
          loading={statsLoading}
          color={stats?.unresolvedFraud && stats.unresolvedFraud > 0 ? "destructive" : "primary"}
          description="Événements suspects non résolus"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12 mt-6">
        {/* 2. Revenue Chart */}
        <Card className="md:col-span-8 border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-muted/10">
            <div>
              <CardTitle className="text-sm font-bold">Flux de Trésorerie (30j)</CardTitle>
              <CardDescription className="text-[10px] uppercase font-black tracking-widest opacity-50 font-mono">Volume des recharges par jour (XAF)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full animate-pulse bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase text-emerald-500/80">Auto-sync (30s)</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              {chartLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Activity className="h-8 w-8 animate-pulse text-muted" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
                      tickFormatter={(str: string) => {
                        const date = new Date(str)
                        return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })
                      }}
                    />
                    <YAxis
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={<ChartTooltip locale={locale} />}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="rect"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Line
                      type="linear"
                      dataKey="credited"
                      name="Revenue"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={<SquareDot />}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                    <Line
                      type="linear"
                      dataKey="pending"
                      name="Pending"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={<SquareDot />}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                    <Line
                      type="linear"
                      dataKey="failed"
                      name="Failed"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={<SquareDot />}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Quick Actions & Alerts */}
        <div className="md:col-span-4 space-y-4">
          {/* Unread Messages CTA */}
          {stats?.unreadMessages ? (
            <Link href="/admin/messages">
              <Card className="bg-primary hover:bg-primary/90 border-none transition-all cursor-pointer group shadow-lg shadow-primary/20 mb-4 rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Support</p>
                      <p className="text-sm font-extrabold">{stats.unreadMessages} nouveaux messages</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </CardContent>
              </Card>
            </Link>
          ) : null}

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Raccourcis</CardTitle>
              <CardDescription className="text-[10px] font-mono uppercase tracking-tighter opacity-50">Actions administratives rapides</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/admin/finance">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  Vérifier les achats
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  Utilisateurs
                </Button>
              </Link>
              <Link href="/admin/fraud">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  Alertes Fraude
                </Button>
              </Link>
              <Link href="/admin/config">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all">
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  Configuration
                </Button>
              </Link>
              <Link href="/admin/audit">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition-all">
                  <History className="h-3.5 w-3.5 text-purple-400" />
                  Audit Log
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageShell>
  )
}
