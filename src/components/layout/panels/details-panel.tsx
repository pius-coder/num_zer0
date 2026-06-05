'use client'

export interface DetailsMvt {
  label: string
  date: string
  credit: number
  debit: number
  amountXaf: number
  soldeApres: number
  statut: string
}

export function DetailsPanel({ mvt }: { mvt: DetailsMvt }) {
  return (
    <div className="px-5 pt-4 pb-3 space-y-3">
      <h3 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
        Détails transaction
      </h3>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Libellé
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right">
          {mvt.label}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Montant
        </span>
        <span
          className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.credit > 0 ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}
        >
          {mvt.credit > 0 ? '+' : '-'}${(mvt.credit || mvt.debit).toFixed(2)} USD
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          FCFA
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          {mvt.amountXaf.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Solde après
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          ${mvt.soldeApres.toFixed(2)} USD
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Date
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          {new Date(mvt.date).toLocaleDateString('fr-FR', {
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
  )
}
