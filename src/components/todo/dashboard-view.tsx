import { useTodoStats, useTodos } from './hooks/use-todos'
import type { View } from '#/routes/(app)/app'

const hours = new Date().getHours()
const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

const tips = [
  { q: 'Break tasks down', a: 'Small steps make big goals achievable.' },
  { q: 'Single task mode', a: 'Focus on one thing at a time.' },
  { q: 'Take breaks', a: 'A 5-minute pause every hour resets focus.' },
  { q: 'Celebrate wins', a: 'Every completed task is progress.' },
  { q: 'Plan ahead', a: 'Spend 5 minutes planning tomorrow.' },
]

function getDailyTip() { return tips[new Date().getDate() % tips.length] }

interface Props {
  onAddTask: () => void
  onNavigate: (v: View, filter?: string) => void
}

export function DashboardView({ onAddTask, onNavigate }: Props) {
  const { data: stats } = useTodoStats()
  const { data: todos } = useTodos()
  const tip = getDailyTip()

  const todayTasks = (todos ?? []).filter((t) => !t.completed && t.dueDateLabel === 'Today').slice(0, 3)
  const completed = stats?.completed ?? 0
  const total = stats?.total ?? 0
  const rate = stats?.rate ?? 0
  const active = total - completed

  const recentActivity = (todos ?? [])
    .filter((t) => t.completed && t.completedAt)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 4)

  const statRows = [
    { label: 'Total tasks', value: String(total), color: 'text-white', filter: 'all' as const },
    { label: 'Completed', value: String(completed), color: 'text-[#25D366]', filter: 'completed' as const },
    { label: 'Remaining', value: String(active), color: 'text-[#F97316]', filter: 'all' as const },
    { label: 'Completion rate', value: `${rate}%`, color: 'text-blue-400', filter: null as string | null },
  ]

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0f0f0f] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:32px_32px] z-0" />

      <div className="relative z-1 px-5 pt-20 md:px-11 md:pt-24 flex-shrink-0">
        <div className="max-w-[640px] w-full mx-auto">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00BA1F] shadow-[0_0_12px_0_rgba(0,186,31,0.3)] anim-pulse-dot" />
              <span className="font-figtree text-xs font-semibold tracking-[-0.015em] uppercase text-[#4f4f4f]">{greeting}</span>
            </div>
            {stats && stats.streak > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full">
                <span className="text-orange-400 text-sm">🔥</span>
                <span className="font-figtree text-xs font-semibold text-orange-400">{stats.streak}d streak</span>
              </div>
            )}
          </div>

          <h1 className="font-figtree font-bold text-[clamp(48px,8vw,64px)] tracking-[-4.5px] leading-[1.1] text-white max-w-full mt-6">
            <span className="inline-block px-[4px] rounded-[2px] [background:linear-gradient(100deg,transparent_0%,transparent_5%,rgba(37,211,102,0.25)_5%,rgba(37,211,102,0.25)_95%,transparent_95%,transparent_100%)]">
              {completed}
            </span>{' '}
            task{completed !== 1 ? 's' : ''} done
          </h1>

          <p className="font-figtree font-medium text-[17px] tracking-[-0.025em] leading-[1.4] text-white/50 max-w-[600px] mt-2">
            {total > 0 ? tip.q : 'Add your first task to get started!'}
          </p>

          <div className="flex flex-col gap-1 mt-5">
            <div className="flex items-center justify-between">
              <span className="font-figtree text-[13px] font-semibold tracking-[-0.015em] uppercase text-white/40">Daily goal</span>
              <span className="font-figtree text-[13px] font-semibold tracking-[-0.015em] text-white/40">{stats?.todayCount ?? 0}/5</span>
            </div>
            <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#25D366] to-[#F97316] rounded-full transition-all duration-500" style={{ width: `${Math.min(((stats?.todayCount ?? 0) / 5) * 100, 100)}%` }} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {statRows.map((s) => (
              <button
                key={s.label}
                onClick={() => s.filter && onNavigate('tasks', s.filter)}
                disabled={!s.filter}
                className={`block w-full text-left bg-dark-800 border border-[#292929] rounded-[12px] px-[18px] py-[14px] flex flex-row gap-[10px] items-center ${
                  s.filter ? 'cursor-pointer hover:bg-white/[0.03] transition-colors' : 'cursor-default'
                }`}
              >
                <div className="flex-none h-5 w-5 relative">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <p className="font-figtree font-medium text-base tracking-[-0.16px] leading-[1.4] text-white m-0">{s.label}</p>
                  <span className={`font-figtree font-semibold text-base ${s.color}`}>{s.value}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={onAddTask}
              className="flex-1 font-figtree font-medium text-[15px] text-white bg-[#F97316] rounded-[14px] px-5 py-3 border-none anim-glow-pulse hover:brightness-110 transition-all cursor-pointer"
            >
              + Add Task
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="font-figtree font-medium text-[15px] text-white/60 border border-[#292929] rounded-[14px] px-5 py-3 bg-transparent hover:text-white/80 transition-colors cursor-pointer"
            >
              View Tasks
            </button>
          </div>

          {stats && stats.busiestHour >= 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-[10px] mt-3">
              <span className="text-sm">⏰</span>
              <span className="font-figtree text-[12px] text-white/50">
                Most productive: <strong className="text-white/70">{stats.busiestHour}:00</strong> — {stats.uniqueDays} active days
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-1 flex-1 overflow-y-auto px-5 pb-6 md:px-11">
        <div className="max-w-[640px] w-full mx-auto flex flex-col gap-5 pt-5">
          {todayTasks.length > 0 && (
            <div>
              <h3 className="font-figtree text-[13px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-3">Today's Tasks</h3>
              <div className="flex flex-col gap-1">
                {todayTasks.map((t) => (
                  <div key={t._id} className="bg-dark-800 border border-[#292929] rounded-[12px] px-[18px] py-[14px] flex flex-row gap-[10px] items-center cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => onNavigate('tasks', 'today')}>
                    <span className={`w-2 h-2 shrink-0 rounded-full ${t.priority === 'p1' ? 'bg-red-400' : t.priority === 'p2' ? 'bg-orange-400' : t.priority === 'p3' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <p className="flex-1 font-figtree font-medium text-base tracking-[-0.16px] leading-[1.4] text-white m-0 truncate">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentActivity.length > 0 && (
            <div>
              <h3 className="font-figtree text-[13px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-3">Recent Activity</h3>
              <div className="flex flex-col gap-1">
                {recentActivity.map((t) => {
                  const ago = Math.round((Date.now() - (t.completedAt ?? Date.now())) / 60000)
                  return (
                    <div
                      key={t._id}
                      onClick={() => onNavigate('tasks', 'completed')}
                      className="bg-dark-800 border border-[#292929] rounded-[12px] px-[18px] py-[14px] flex flex-row gap-[10px] items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="w-2 h-2 shrink-0 rounded-full bg-[#25D366]" />
                      <p className="flex-1 font-figtree font-medium text-base tracking-[-0.16px] leading-[1.4] text-white/65 m-0">
                        Completed <strong className="text-white">{t.text}</strong>
                      </p>
                      <span className="font-figtree text-[13px] tracking-[-0.01em] text-white/40">{ago < 1 ? 'now' : `${ago}m ago`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {total > 0 && (
            <div className="border border-[#292929] rounded-[26px] overflow-hidden relative bg-[#121212] md:rounded-[44px]">
              <div className="relative px-5 py-6 md:px-8 md:py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-full mb-3">
                  <span className="font-figtree text-xs font-semibold tracking-[-0.015em] uppercase text-white/40">TIP</span>
                </div>
                <p className="font-figtree font-medium text-[18px] tracking-[-0.3px] leading-[1.5] text-white m-0 italic md:text-[20px]">
                  &ldquo;{tip.q}&rdquo;
                </p>
                <p className="font-figtree font-medium text-[14px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-4 md:text-[16px]">
                  {tip.a}
                </p>
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="flex flex-col items-center gap-4 py-8 font-figtree text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-[16px] bg-white/[0.04] border border-dashed border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/20">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-medium text-white/60">No tasks yet</span>
              <p className="font-figtree text-sm text-white/40 mt-1 max-w-[300px]">Add your first task and start tracking your progress today!</p>
              <button onClick={onAddTask} className="font-figtree font-medium text-[14px] text-white bg-[#F97316] rounded-[12px] px-5 py-2.5 border-none anim-glow-pulse hover:brightness-110 transition-all cursor-pointer">
                Create your first task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
