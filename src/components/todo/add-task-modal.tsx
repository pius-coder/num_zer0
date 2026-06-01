import { useState, useEffect, useRef } from 'react'
import { useAddTodoMutation, useUpdateTodoMutation } from './hooks/use-todos'
import { categoryConfig, priorityConfig } from './category-icons'
import type { AddModalState } from '#/routes/(app)/app'

interface Props {
  initialState: AddModalState
  onClose: () => void
}

function parseSmartText(text: string) {
  const priorityMap: Record<string, 'p1' | 'p2' | 'p3' | 'p4'> = {
    p1: 'p1', urgent: 'p1', critical: 'p1',
    p2: 'p2', high: 'p2',
    p3: 'p3', medium: 'p3',
    p4: 'p4', low: 'p4',
  }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let priority: 'p1' | 'p2' | 'p3' | 'p4' = 'p3'
  let category: string | undefined
  let dueDateLabel: string | undefined
  const filtered: string[] = []
  for (const w of text.split(/\s+/)) {
    const l = w.toLowerCase()
    if (priorityMap[l]) { priority = priorityMap[l]; continue }
    if (categoryConfig[l]) { category = l; continue }
    if (l === 'today') { dueDateLabel = 'Today'; continue }
    if (l === 'tomorrow') { dueDateLabel = 'Tomorrow'; continue }
    if (l.startsWith('#') && categoryConfig[l.slice(1)]) { category = l.slice(1); continue }
    filtered.push(w)
  }
  return { title: filtered.join(' ').trim() || text, priority, category, dueDateLabel }
}

export function AddTaskModal({ initialState, onClose }: Props) {
  const { mutate: addTodo, isPending: isAdding } = useAddTodoMutation()
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodoMutation()
  const isEditing = initialState.mode === 'edit'

  const parsed = parseSmartText(initialState.text ?? '')
  const [text, setText] = useState(parsed.title)
  const [priority, setPriority] = useState<'p1' | 'p2' | 'p3' | 'p4'>(initialState.priority ?? parsed.priority)
  const [category, setCategory] = useState<string | undefined>(initialState.category ?? parsed.category)
  const [dueDateLabel, setDueDateLabel] = useState(initialState.dueDateLabel ?? parsed.dueDateLabel ?? '')
  const [notes, setNotes] = useState(initialState.notes ?? '')
  const [recurring, setRecurring] = useState(initialState.recurring)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit() {
    if (!text.trim() || isAdding || isUpdating) return
    const dueDate = dueDateLabel === 'Today' ? new Date().setHours(0, 0, 0, 0)
      : dueDateLabel === 'Tomorrow' ? new Date().setHours(0, 0, 0, 0) + 86400000
      : undefined
    if (isEditing && initialState.editId) {
      updateTodo({ id: initialState.editId, text: text.trim(), priority, category, dueDateLabel: dueDateLabel || undefined, notes: notes || undefined, recurring }, {
        onSuccess: onClose,
      })
    } else {
      addTodo({ text: text.trim(), priority, category, dueDate, dueDateLabel: dueDateLabel || undefined, notes: notes || undefined, recurring }, {
        onSuccess: onClose,
      })
    }
  }

  const isPending = isAdding || isUpdating

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[calc(100%-24px)] max-w-[480px] max-h-[85vh] overflow-y-auto border border-dark-700 bg-dark-800 rounded-[24px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#292929]">
          <h2 className="font-figtree text-[20px] font-[400] tracking-[-0.04em] text-white m-0">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-[10px] text-white/40 hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer bg-transparent border-none">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3l-10 10" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-transparent border border-[#292929] rounded-[14px] px-4 py-3 font-figtree text-[16px] text-white/85 outline-none placeholder:text-white/20 focus:border-white/20 transition-colors"
          />

          <div>
            <p className="font-figtree text-[11px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">Priority</p>
            <div className="flex gap-2">
              {(Object.entries(priorityConfig) as ['p1' | 'p2' | 'p3' | 'p4', typeof priorityConfig['p1']][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  className={`flex-1 font-figtree text-[12px] font-medium px-3 py-2 rounded-[10px] border transition-colors cursor-pointer ${
                    priority === key
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'border-[#292929] text-white/40 hover:text-white/60 bg-transparent'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot} mr-1.5 align-middle`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-figtree text-[11px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">Category</p>
            <div className="flex gap-2">
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setCategory(category === key ? undefined : key)}
                  className={`flex items-center gap-1.5 font-figtree text-[12px] font-medium px-3 py-2 rounded-[10px] border transition-colors cursor-pointer ${
                    category === key
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'border-[#292929] text-white/40 hover:text-white/60 bg-transparent'
                  }`}
                >
                  <cfg.icon />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-figtree text-[11px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">Due Date</p>
            <input
              type="text"
              value={dueDateLabel}
              onChange={(e) => setDueDateLabel(e.target.value)}
              placeholder="today, tomorrow, Jun 15..."
              className="w-full bg-transparent border border-[#292929] rounded-[10px] px-3 py-2 font-figtree text-[13px] text-white/70 outline-none placeholder:text-white/20"
            />
          </div>

          <div>
            <p className="font-figtree text-[11px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">Recurring</p>
            <div className="flex gap-2">
              {[undefined, 'daily', 'weekly', 'monthly'].map((r) => (
                <button
                  key={r ?? 'none'}
                  onClick={() => setRecurring(r as typeof recurring)}
                  className={`font-figtree text-[12px] font-medium px-3 py-2 rounded-[10px] border transition-colors cursor-pointer ${
                    recurring === r
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'border-[#292929] text-white/40 hover:text-white/60 bg-transparent'
                  }`}
                >
                  {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'None'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-figtree text-[11px] font-semibold tracking-[0.05em] uppercase text-white/40 mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-transparent border border-[#292929] rounded-[10px] px-3 py-2 font-figtree text-[13px] text-white/70 outline-none placeholder:text-white/20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
            className="flex-1 font-figtree font-medium text-[15px] text-white bg-[#F97316] rounded-[14px] px-5 py-3 border-none disabled:opacity-40 disabled:cursor-not-allowed anim-glow-pulse hover:brightness-110 transition-all cursor-pointer"
          >
            {isPending ? 'Saving...' : isEditing ? 'Update Task' : 'Add Task'}
          </button>
          <button
            onClick={onClose}
            className="font-figtree font-medium text-[15px] text-white/60 bg-transparent border border-[#292929] rounded-[14px] px-5 py-3 hover:text-white/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
