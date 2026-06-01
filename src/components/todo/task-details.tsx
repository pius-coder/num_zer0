import { useState } from 'react'
import { useUpdateTodoMutation } from './hooks/use-todos'
import { categoryConfig, priorityConfig } from './category-icons'
import type { Doc } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>

interface Props {
  todo: Todo
  onClose: () => void
}

export function TaskDetails({ todo, onClose: _onClose }: Props) {
  const [notes, setNotes] = useState(todo.notes || '')
  const [subtasks, setSubtasks] = useState(todo.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')
  const { mutate: update } = useUpdateTodoMutation()

  function saveNotes() {
    if (notes !== (todo.notes || '')) {
      update({ id: todo._id, notes })
    }
  }

  function toggleSubtask(id: string) {
    const next = subtasks.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s,
    )
    setSubtasks(next)
    update({ id: todo._id, subtasks: next })
  }

  function addSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubtask.trim()) return
    const st = { id: `st_${Date.now()}`, text: newSubtask.trim(), completed: false }
    const next = [...subtasks, st]
    setSubtasks(next)
    setNewSubtask('')
    update({ id: todo._id, subtasks: next })
  }

  function removeSubtask(id: string) {
    const next = subtasks.filter((s) => s.id !== id)
    setSubtasks(next)
    update({ id: todo._id, subtasks: next })
  }

  const cat = todo.category ? categoryConfig[todo.category] : null
  const pri = priorityConfig[todo.priority ?? 'p3']

  return (
    <div className="px-4 pb-4 md:px-5 md:pb-5">
      <div className="bg-white/[0.04] rounded-[12px] p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 font-figtree text-[11px] font-medium ${pri.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
            {pri.label}
          </span>
          {cat && (
            <span className={`inline-flex items-center gap-1 font-figtree text-[11px] font-medium ${cat.color}`}>
              <cat.icon />
              {cat.label}
            </span>
          )}
          {todo.dueDateLabel && (
            <span className={`font-figtree text-[11px] font-medium ${todo.dueDate && todo.dueDate < Date.now() && !todo.completed ? 'text-red-400' : 'text-white/50'}`}>
              {todo.dueDate && todo.dueDate < Date.now() && !todo.completed ? 'Overdue' : todo.dueDateLabel}
            </span>
          )}
          {todo.recurring && (
            <span className="font-figtree text-[11px] font-medium text-white/50 capitalize">
              🔄 {todo.recurring}
            </span>
          )}
        </div>

        <form onSubmit={addSubtask} className="flex gap-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add subtask..."
            className="flex-1 bg-transparent border border-[#292929] rounded-[8px] px-3 py-1.5 font-figtree text-[13px] text-white/70 outline-none placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={!newSubtask.trim()}
            className="font-figtree text-[12px] text-[#25D366] bg-transparent border-none cursor-pointer disabled:opacity-30"
          >
            Add
          </button>
        </form>

        {subtasks.length > 0 && (
          <div className="flex flex-col gap-1">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleSubtask(st.id)}
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${st.completed ? 'bg-[#25D366] border-[#25D366]' : 'border-white/20'} cursor-pointer bg-transparent`}
                >
                  {st.completed && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" className="text-white">
                      <path d="M2.5 6L5 8.5L9.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 font-figtree text-[13px] ${st.completed ? 'text-white/30 line-through' : 'text-white/70'}`}>
                  {st.text}
                </span>
                <button
                  onClick={() => removeSubtask(st.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 bg-transparent border-none cursor-pointer transition-opacity"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Add notes..."
          rows={2}
          className="w-full bg-transparent border border-[#292929] rounded-[8px] px-3 py-2 font-figtree text-[13px] text-white/70 outline-none placeholder:text-white/20 resize-none"
        />
      </div>
    </div>
  )
}
