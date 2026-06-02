'use client'

import { useState } from 'react'

export function SupportMessageForm() {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setIsSending(true)
    // TODO: wire to support message API
    setIsSending(false)
    setMessage('')
  }

  return (
    <div className='space-y-3'>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Décrivez votre problème...'
        className='h-32 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none'
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className='w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50'
      >
        {isSending ? 'Envoi...' : 'Envoyer'}
      </button>
    </div>
  )
}
