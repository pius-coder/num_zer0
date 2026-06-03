'use client'

import { Phone, Mail } from 'lucide-react'

export function SupportOptions() {
  return (
    <div className="space-y-3">
      <a
        href="https://wa.me/237622558849"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
      >
        <div className="p-1.5 rounded-lg">
          <Phone className="h-3.5 w-3.5 text-success" />
        </div>
        <div>
          <p className="text-sm font-medium">WhatsApp</p>
          <p className="text-xs text-muted-foreground">Réponse rapide</p>
        </div>
      </a>
      <a
        href="mailto:support@numzero.com"
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
      >
        <div className="p-1.5 rounded-lg">
          <Mail className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Email</p>
          <p className="text-xs text-muted-foreground">support@numzero.com</p>
        </div>
      </a>
    </div>
  )
}
