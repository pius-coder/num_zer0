import { useState, useRef, type FormEvent } from 'react'
import { priorityConfig } from './category-icons'

interface Props {
  onOpenModal: (text?: string) => void
}

export function QuickAdd({ onOpenModal }: Props) {
  const [text, setText] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<'p1' | 'p2' | 'p3' | 'p4'>('p3')
  const [showPriority, setShowPriority] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onOpenModal(text.trim())
    setText('')
    setSelectedPriority('p3')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!text.trim()) return
      onOpenModal(text.trim())
      setText('')
      setSelectedPriority('p3')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 border border-[#292929] bg-dark-800 rounded-[14px] px-4 py-[10px] transition-colors focus-within:border-white/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/30 shrink-0">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task... (try: buy milk tomorrow high work)"
            className="flex-1 bg-transparent border-none font-figtree text-[14px] text-white/85 outline-none placeholder:text-white/20 py-0"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!text.trim()) return
            onOpenModal(text.trim())
            setText('')
            setSelectedPriority('p3')
          }}
          disabled={!text.trim()}
          className="shrink-0 flex items-center justify-center w-[42px] h-[42px] rounded-[14px] bg-[#F97316] text-white disabled:opacity-40 disabled:cursor-not-allowed anim-glow-pulse hover:brightness-110 transition-all cursor-pointer border-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPriority(!showPriority)}
          className="font-figtree text-[11px] tracking-[-0.01em] text-white/40 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
        >
          Priority
        </button>
        {showPriority && (
          <div className="flex gap-1.5">
            {(Object.entries(priorityConfig) as ['p1' | 'p2' | 'p3' | 'p4', typeof priorityConfig['p1']][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setSelectedPriority(key); setShowPriority(false) }}
                className={`font-figtree text-[11px] font-medium tracking-[-0.01em] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  selectedPriority === key
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 bg-transparent'
                }`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
                {cfg.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}
