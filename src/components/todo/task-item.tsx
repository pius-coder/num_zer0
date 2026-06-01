import { useState } from 'react'
import { useToggleTodoMutation, useRemoveTodoMutation } from './hooks/use-todos'
import { categoryConfig, priorityConfig } from './category-icons'
import { TaskDetails } from './task-details'
import type { Doc } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>

interface Props {
  todo: Todo
  onEditTask?: (todo: Todo) => void
}

export function TaskItem({ todo, onEditTask }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { mutate: toggleTodo, isPending: isToggling } = useToggleTodoMutation()
  const { mutate: removeTodo } = useRemoveTodoMutation()

  const cat = todo.category ? categoryConfig[todo.category] : null
  const pri = priorityConfig[todo.priority ?? 'p3']
  const subtaskCount = todo.subtasks?.length ?? 0
  const subtaskDone = todo.subtasks?.filter((s) => s.completed).length ?? 0
  const isOverdue = todo.dueDate && todo.dueDate < Date.now() && !todo.completed
  const [celebrate, setCelebrate] = useState(false)

  function handleToggle() {
    if (todo.completed) {
      toggleTodo({ id: todo._id })
    } else {
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 800)
      toggleTodo({ id: todo._id })
    }
  }

  return (
    <div
      className={`transition-colors relative ${todo.completed ? 'opacity-50' : ''} ${expanded ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
    >
      {celebrate && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 text-[10px]"
              style={{
                left: `${15 + i * 14}%`,
                animation: `anim-fade-in-up 0.6s ease-out ${i * 0.08}s forwards, float 3s ease-in-out ${i * 0.08}s infinite`,
                opacity: 0,
              }}
            >
              🎉
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer bg-transparent ${
            todo.completed
              ? 'border-[#25D366] bg-[#25D366] text-white'
              : 'border-white/20 text-transparent hover:border-white/40'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${pri.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-figtree text-[14px] tracking-[-0.01em] leading-[1.4] truncate ${
                todo.completed ? 'text-white/40 line-through' : 'text-white/85'
              }`}
            >
              {todo.text}
            </span>
            {subtaskCount > 0 && (
              <span className="font-figtree text-[10px] text-white/30 shrink-0">{subtaskDone}/{subtaskCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {cat && (
              <span className={`inline-flex items-center gap-1 font-figtree text-[10px] ${cat.color}`}>
                <cat.icon />
                {cat.label}
              </span>
            )}
            {todo.dueDateLabel && (
              <span className={`font-figtree text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                {isOverdue ? 'Overdue' : todo.dueDateLabel}
              </span>
            )}
            {todo.recurring && (
              <span className="font-figtree text-[10px] text-white/30 capitalize">🔄 {todo.recurring}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEditTask && (
            <button
              onClick={() => onEditTask(todo)}
              className="flex size-7 items-center justify-center rounded-[8px] text-white/20 hover:bg-white/10 hover:text-white/60 transition-all cursor-pointer bg-transparent border-none"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex size-7 items-center justify-center rounded-[8px] text-white/30 hover:bg-white/10 hover:text-white/60 transition-all cursor-pointer bg-transparent border-none"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="M4 5l3 3 3-3" />
            </svg>
          </button>
          <button
            onClick={() => removeTodo({ id: todo._id })}
            className="flex size-7 items-center justify-center rounded-[8px] text-white/30 hover:bg-white/10 hover:text-red-400 transition-all cursor-pointer bg-transparent border-none"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 4h8M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M4 4v6a1 1 0 001 1h4a1 1 0 001-1V4" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <TaskDetails todo={todo} onClose={() => setExpanded(false)} />
      </div>
    </div>
  )
}
