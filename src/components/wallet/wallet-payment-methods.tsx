'use client'

const defaultMethods = [
  { id: 'mtn', label: 'MTN MoMo', detail: '+237 6XX XX XX XX', isDefault: true },
  { id: 'orange', label: 'Orange Money', detail: '+237 6YY YY YY YY', isDefault: false },
  { id: 'card', label: 'Carte bancaire', detail: '•••• 4242', isDefault: false },
]

export function WalletPaymentMethods() {
  return (
    <div className="p-4">
      <h3 className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-3">
        Moyens de paiement par défaut
      </h3>
      <div className="grid gap-2 sm:grid-cols-3">
        {defaultMethods.map((method) => (
          <div key={method.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25]">
                {method.label}
              </p>
              {method.isDefault && (
                <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
                  Défaut
                </span>
              )}
            </div>
            <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mt-1">
              {method.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
