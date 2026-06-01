import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('todos')
      .withIndex('by_creation_time')
      .order('desc')
      .collect()
  },
})

function parseSmartText(text: string) {
  let title = text
  let priority: 'p1' | 'p2' | 'p3' | 'p4' = 'p3'
  let category: string | undefined
  let dueDate: number | undefined
  let dueDateLabel: string | undefined

  const priorityMap: Record<string, 'p1' | 'p2' | 'p3' | 'p4'> = {
    p1: 'p1', urgent: 'p1', critical: 'p1',
    p2: 'p2', high: 'p2',
    p3: 'p3', medium: 'p3',
    p4: 'p4', low: 'p4',
  }

  const categoryMap: Record<string, string> = {
    work: 'work', finance: 'finance', personal: 'personal', health: 'health', shopping: 'shopping',
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const words = text.split(/\s+/)
  const filtered: string[] = []

  for (const word of words) {
    const lower = word.toLowerCase()
    if (priorityMap[lower]) {
      priority = priorityMap[lower]
      continue
    }
    if (categoryMap[lower]) {
      category = lower
      continue
    }
    if (lower === 'today') {
      dueDate = today.getTime()
      dueDateLabel = 'Today'
      continue
    }
    if (lower === 'tomorrow') {
      dueDate = today.getTime() + 86400000
      dueDateLabel = 'Tomorrow'
      continue
    }
    if (lower.startsWith('#')) {
      const tag = lower.slice(1)
      if (categoryMap[tag]) {
        category = tag
        continue
      }
    }
    filtered.push(word)
  }

  title = filtered.join(' ').trim() || text

  return { title, priority, category, dueDate, dueDateLabel }
}

export const add = mutation({
  args: {
    text: v.string(),
    priority: v.optional(v.union(v.literal('p1'), v.literal('p2'), v.literal('p3'), v.literal('p4'))),
    category: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    dueDateLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
    subtasks: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      completed: v.boolean(),
    }))),
    recurring: v.optional(v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'))),
  },
  handler: async (ctx, args) => {
    const parsed = parseSmartText(args.text)
    return await ctx.db.insert('todos', {
      text: parsed.title,
      completed: false,
      priority: args.priority || parsed.priority,
      category: args.category || parsed.category,
      dueDate: args.dueDate || parsed.dueDate,
      dueDateLabel: args.dueDateLabel || parsed.dueDateLabel,
      notes: args.notes,
      subtasks: args.subtasks,
      recurring: args.recurring,
    })
  },
})

export const toggle = mutation({
  args: { id: v.id('todos') },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id)
    if (!todo) throw new Error('Todo not found')
    const now = Date.now()
    return await ctx.db.patch(args.id, {
      completed: !todo.completed,
      completedAt: todo.completed ? undefined : now,
    })
  },
})

export const remove = mutation({
  args: { id: v.id('todos') },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  },
})

export const update = mutation({
  args: {
    id: v.id('todos'),
    text: v.optional(v.string()),
    priority: v.optional(v.union(v.literal('p1'), v.literal('p2'), v.literal('p3'), v.literal('p4'))),
    category: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    dueDateLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
    subtasks: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      completed: v.boolean(),
    }))),
    recurring: v.optional(v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'))),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    await ctx.db.patch(id, fields)
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query('todos').collect()
    const total = todos.length
    const completed = todos.filter((t) => t.completed).length
    const active = total - completed
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    const now = Date.now()
    const overdue = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < now).length

    const completedDates = todos
      .filter((t) => t.completed && t.completedAt)
      .map((t) => {
        const d = new Date(t.completedAt!)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    const uniqueDays = new Set(completedDates).size

    const todayStr = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`
    const todayCount = completedDates.filter((d) => d === todayStr).length

    let streak = 0
    const check = new Date()
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`
      if (completedDates.includes(key)) {
        streak++
        check.setDate(check.getDate() - 1)
      } else {
        break
      }
    }

    const hourCounts: Record<number, number> = {}
    todos.forEach((t) => {
      if (t.completedAt) {
        const h = new Date(t.completedAt).getHours()
        hourCounts[h] = (hourCounts[h] || 0) + 1
      }
    })
    let busiestHour = -1
    let maxCount = 0
    for (const [h, c] of Object.entries(hourCounts)) {
      if (c > maxCount) { maxCount = c; busiestHour = parseInt(h) }
    }

    return {
      total,
      completed,
      active,
      rate,
      overdue,
      streak,
      uniqueDays,
      todayCount,
      busiestHour,
    }
  },
})
