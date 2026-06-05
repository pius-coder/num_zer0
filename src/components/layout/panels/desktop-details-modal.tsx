'use client'

export function DesktopDetailsModal({
  mvt,
  onClose,
}: {
  mvt: Record<string, unknown>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 rounded-2xl w-full max-w-md p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          Fermer
        </button>
        <h3 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          Détails transaction
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Libellé
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right">
              {String(mvt.label ?? '')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Montant
            </span>
            <span
              className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${Number(mvt.credit) > 0 ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}
            >
              {Number(mvt.credit) > 0 ? '+' : '-'}$
              {(Number(mvt.credit) || Number(mvt.debit)).toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              FCFA
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              {Number(mvt.amountXaf).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Solde après
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              ${Number(mvt.soldeApres).toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Date
            </span>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              {new Date(String(mvt.date)).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
              Statut
            </span>
            <span
              className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.statut === 'validee' ? 'text-[#25D366]' : mvt.statut === 'annulee' ? 'text-red-500' : 'text-yellow-500'}`}
            >
              {mvt.statut === 'validee'
                ? 'Validée'
                : mvt.statut === 'annulee'
                  ? 'Annulée'
                  : 'En attente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
