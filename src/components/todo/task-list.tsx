import { useMemo, useState, useEffect, useRef } from 'react'
import { useTodos } from './hooks/use-todos'
import { TaskItem } from './task-item'
import { categoryConfig } from './category-icons'
import type { Doc } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>
type Filter = 'all' | 'today' | 'priority' | 'completed'

interface Props {
  onEditTask?: (todo: Todo) => void
  initialFilter?: string
}

function getDateLabel(todo: Todo): string {
  if (!todo.dueDateLabel || !todo.dueDate) return 'Upcoming'
  const now = Date.now()
  const day = 86400000
  if (todo.dueDate < now && !todo.completed) return 'Overdue'
  if (todo.dueDateLabel === 'Today') return 'Today'
  if (todo.dueDateLabel === 'Tomorrow') return 'Tomorrow'
  if (todo.dueDate - now < 7 * day) return 'This Week'
  return 'Upcoming'
}

export function TaskList({ onEditTask, initialFilter }: Props) {
  const { data: todos, isLoading } = useTodos()
  const [filter, setFilter] = useState<Filter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const validFilters: Filter[] = ['all', 'today', 'priority', 'completed']
  const safeInitial = initialFilter && validFilters.includes(initialFilter as Filter) ? initialFilter as Filter : undefined

  const initialApplied = useRef(false)
  useEffect(() => {
    if (safeInitial && !initialApplied.current) {
      setFilter(safeInitial)
      initialApplied.current = true
    }
  }, [safeInitial])

  const filtered = useMemo(() => {
    if (!todos) return []
    let items = [...todos]
    if (filter === 'completed') items = items.filter((t) => t.completed)
    else if (filter === 'today') items = items.filter((t) => t.dueDateLabel === 'Today')
    else if (filter === 'priority') items = items.filter((t) => !t.completed).sort((a, b) => {
      const order = { p1: 0, p2: 1, p3: 2, p4: 3 }
      return (order[a.priority ?? 'p3'] ?? 3) - (order[b.priority ?? 'p3'] ?? 3)
    })
    else items = items.filter((t) => !t.completed)
    if (categoryFilter) items = items.filter((t) => t.category === categoryFilter)
    if (search.trim()) items = items.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()))
    return items
  }, [todos, filter, categoryFilter, search])

  const grouped = useMemo(() => {
    if (filter === 'priority') return { 'Priority': filtered }
    if (filter === 'completed') return { 'Completed': filtered }
    const groups: Record<string, typeof filtered> = {}
    filtered.forEach((t) => {
      const label = getDateLabel(t)
      if (!groups[label]) groups[label] = []
      groups[label].push(t)
    })
    return groups
  }, [filtered, filter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 font-figtree text-sm text-white/50">
        <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-[#25D366]" />
        Loading tasks...
      </div>
    )
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 font-figtree text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-[16px] bg-white/[0.04] border border-dashed border-white/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/20">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <span className="font-medium text-white/60">No tasks yet</span>
          <p className="font-figtree text-sm text-white/40 mt-1">Add your first task above and start tracking progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'today', 'priority', 'completed'] as Filter[]).map((f) => {
            const labels: Record<Filter, string> = { all: 'All', today: 'Today', priority: 'Priority', completed: 'Done' }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-figtree text-[11px] font-medium tracking-[-0.01em] px-3 py-1.5 rounded-full border transition-colors cursor-pointer bg-transparent ${
                  filter === f
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                }`}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex size-7 items-center justify-center rounded-[8px] text-white/30 hover:bg-white/10 hover:text-white/60 transition-all cursor-pointer bg-transparent border-none"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" />
          </svg>
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`font-figtree text-[10px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer bg-transparent ${
            !categoryFilter ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-white/30 hover:text-white/50'
          }`}
        >
          All
        </button>
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
            className={`inline-flex items-center gap-1 font-figtree text-[10px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer bg-transparent ${
              categoryFilter === key
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/10 text-white/30 hover:text-white/50'
            }`}
          >
            <cfg.icon />
            {cfg.label}
          </button>
        ))}
      </div>

      {showSearch && (
        <div className="border border-[#292929] bg-dark-800 rounded-[10px] flex items-center gap-2 px-3 py-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent border-none font-figtree text-[13px] text-white/70 outline-none placeholder:text-white/20 py-0"
          />
        </div>
      )}

      <div className="divide-y divide-[#292929] border border-[#292929] bg-dark-800 rounded-[14px] overflow-hidden">
        {Object.entries(grouped).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            {filter !== 'priority' && filter !== 'completed' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02]">
                <span className="font-figtree text-[10px] font-semibold tracking-[0.05em] uppercase text-white/30">
                  {groupLabel}
                </span>
                <span className="font-figtree text-[10px] text-white/20">{items.length}</span>
              </div>
            )}
            {items.map((todo) => (
              <TaskItem key={todo._id} todo={todo} onEditTask={onEditTask} />
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 font-figtree text-sm">
            <span className="text-white/40">No matching tasks</span>
          </div>
        )}
      </div>
    </div>
  )
}
