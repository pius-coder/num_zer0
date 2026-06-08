export function AdminOrders() {
  return (
    <div className="space-y-4">
      <p className="text-[var(--sea-ink-soft)] text-sm">
        Commandes — accessible via historique payment_intents
      </p>
      <div className="rounded-xl border border-[var(--line)]/20 p-6 text-center text-[var(--sea-ink-soft)]">
        Les ordres sont listés dans l'onglet Payment Intents.
        Un onglet dédié sera ajouté si nécessaire.
      </div>
    </div>
  )
}
