import { useState, useCallback, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardView } from '#/components/todo/dashboard-view'
import { TasksView } from '#/components/todo/tasks-view'
import { AddTaskModal } from '#/components/todo/add-task-modal'
import { SITE } from '#/components/landing/data'
import '#/components/landing/animations.css'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>
export type View = 'dashboard' | 'tasks'

const REMIX_SHADOW = "rgba(0,0,0,0.68) 0px -0.48175px 0.48175px -1.25px inset, rgba(0,0,0,0.596) 0px -1.83083px 1.83083px -2.5px inset, rgba(0,0,0,0.235) 0px -8px 8px -3.75px inset"

export interface AddModalState {
  open: boolean
  mode: 'create' | 'edit'
  text?: string
  priority?: 'p1' | 'p2' | 'p3' | 'p4'
  editId?: Id<'todos'>
  category?: string
  dueDateLabel?: string
  notes?: string
  recurring?: 'daily' | 'weekly' | 'monthly'
}

export const Route = createFileRoute('/(app)/app')({
  ssr: false,
  component: AppPage,
})

export interface NavigateOptions {
  view: View
  filter?: string
}

function AppPage() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    return (localStorage.getItem('n0_view') as View) || 'dashboard'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [addModal, setAddModal] = useState<AddModalState>({ open: false, mode: 'create' })
  const [initialFilter, setInitialFilter] = useState<string | undefined>()

  useEffect(() => {
    localStorage.setItem('n0_view', view)
  }, [view])

  const navigate = useCallback((v: View, filter?: string) => {
    setView(v)
    setInitialFilter(filter)
    setMenuOpen(false)
  }, [])

  function openAddModal(text?: string) {
    setAddModal({ open: true, mode: 'create', text })
    setMenuOpen(false)
  }

  function openEditModal(todo: Todo) {
    setAddModal({
      open: true,
      mode: 'edit',
      text: todo.text,
      priority: todo.priority ?? 'p3',
      editId: todo._id,
      category: todo.category,
      dueDateLabel: todo.dueDateLabel,
      notes: todo.notes,
      recurring: todo.recurring,
    })
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0f0f0f] flex flex-col relative">
      <div className="flex-1 relative">
        {view === 'dashboard'
          ? <DashboardView onAddTask={() => openAddModal()} onNavigate={navigate} />
          : <TasksView onAddTask={() => openAddModal()} onEditTask={openEditModal} initialFilter={initialFilter} />
        }
      </div>

      <span className="fixed top-3 left-3 z-10 font-figtree font-bold text-[22px] text-[#25D366] md:text-xl md:left-6 md:top-6">
        {SITE.shortName}
      </span>

      <button
        onClick={() => view === 'tasks' ? navigate('dashboard') : setMenuOpen(!menuOpen)}
        className="fixed bottom-3 right-3 z-10 w-14 h-14 rounded-[16px] border border-dark-700 bg-dark-800 text-white shadow-lg flex items-center justify-center md:bottom-6 md:right-6 hover:brightness-110 transition-all cursor-pointer"
        aria-label={view === 'tasks' ? 'Back to Dashboard' : 'Menu'}
      >
        {view === 'tasks' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 fill-white">
            <path d="M216,128a6,6,0,0,1-6,6H67.31l58.35,58.34a6,6,0,0,1-8.49,8.49l-68-68a6,6,0,0,1,0-8.49l68-68a6,6,0,0,1,8.49,8.49L67.31,122H210A6,6,0,0,1,216,128Z" />
          </svg>
        ) : menuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 fill-white">
            <path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 fill-white">
            <path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128ZM40,70H216a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12ZM216,186H40a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12Z" />
          </svg>
        )}
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-24 left-3 right-3 md:bottom-28 md:left-auto md:right-6 md:w-[400px]">
            <div className="border border-dark-700 bg-dark-800 rounded-[16px] md:rounded-[72px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-[22px] px-5 pt-6 pb-5">
                <div className="flex flex-col gap-3">
                  {([
                    { key: 'dashboard' as View, label: 'Dashboard', desc: 'Overview & stats' },
                    { key: 'tasks' as View, label: 'Tasks', desc: 'Manage your tasks' },
                  ]).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={`block bg-transparent w-full text-left cursor-pointer border-none p-0 group ${
                        view === item.key ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                      } transition-opacity`}
                    >
                      <h3 className="font-figtree font-medium text-[32px] tracking-[-0.04em] leading-[1.4] text-white m-0">
                        {item.label}
                      </h3>
                      <p className="font-figtree text-sm tracking-[-0.01em] text-white/40 m-0 mt-[-2px]">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAddModal()}
                    className="flex-1 flex items-center justify-center h-11 px-4 py-3 rounded-[14px] bg-[#F97316] border-none cursor-pointer anim-glow-pulse"
                  >
                    <span className="font-figtree font-semibold text-lg tracking-[-0.04em] leading-[1.4] text-white">
                      + New Task
                    </span>
                  </button>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex-none w-11 h-11 flex items-center justify-center rounded-[14px] border border-dark-700 bg-dark-700 cursor-pointer"
                    style={{ boxShadow: REMIX_SHADOW }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-5 h-5 fill-white">
                      <path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {addModal.open && (
        <AddTaskModal
          initialState={addModal}
          onClose={() => setAddModal({ open: false, mode: 'create' })}
        />
      )}
    </div>
  )
}
