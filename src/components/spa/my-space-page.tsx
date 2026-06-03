'use client'

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import type { Service, CountryPrice } from '@/components/services/data'
import type { SmsActivation, SmsActivationStatus } from '@/type/sms_activation'
import type { Id } from '../../../convex/_generated/dataModel'
import { useBottomNav } from '@/components/layout/bottom-nav-store'
import {
  useInitiateActivation,
  useActivation,
  useMyActivations,
  useCompleteActivation,
  useCancelActivation,
  useRequestAnotherSms,
  useBalance,
} from '@/components/purchases/hooks'

type PageView =
  | { kind: 'services' }
  | { kind: 'countries'; service: Service }
  | { kind: 'confirm'; service: Service; country: CountryPrice }
  | { kind: 'activation'; activationId: Id<'activations'> }

const STATUS_LABELS: Record<SmsActivationStatus, string> = {
  awaiting_number: 'Attribution du numéro…',
  awaiting_sms: 'En attente du SMS…',
  sms_received: 'SMS reçu',
  completed: 'Activation terminée',
  cancelled: 'Annulée',
  expired: 'Expirée',
  no_numbers: 'Aucun numéro disponible',
  max_price_too_low: 'Prix maximum trop bas',
}

const STATUS_COLORS: Record<SmsActivationStatus, string> = {
  awaiting_number: 'text-amber-500',
  awaiting_sms: 'text-amber-500',
  sms_received: 'text-[#25D366]',
  completed: 'text-[#25D366]',
  cancelled: 'text-red-500',
  expired: 'text-gray-400',
  no_numbers: 'text-red-500',
  max_price_too_low: 'text-red-500',
}

function isActiveStatus(status: SmsActivationStatus) {
  return status === 'awaiting_number' || status === 'awaiting_sms' || status === 'sms_received'
}

// ─── Main page ──

export function MySpacePage() {
  const navigate = useNavigate()
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const [view, setView] = useState<PageView>({ kind: 'services' })
  const { openPanel } = useBottomNav()
  const { data: myActivations } = useMyActivations()
  const { data: balanceData } = useBalance()

  // ── Not authenticated → redirect to dedicated auth-splash route ──
  if (!isSessionLoading && !session) {
    navigate({ to: '/auth-splash' })
    return null
  }

  if (isSessionLoading) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <p className="font-figtree text-[var(--sea-ink-soft)] text-[18px] font-medium tracking-[-0.04em]">
          Chargement…
        </p>
      </div>
    )
  }

  const activeActivations = (myActivations ?? []).filter((a) => isActiveStatus(a.status))
  const pastActivations = (myActivations ?? []).filter((a) => !isActiveStatus(a.status))
  const balanceUsd = balanceData?.balanceUsd ?? 0

  switch (view.kind) {
    case 'activation':
      return (
        <ActivationDetail
          activationId={view.activationId as Id<'activations'>}
          onBack={() => setView({ kind: 'services' })}
        />
      )
    case 'confirm':
      return (
        <PurchaseConfirmation
          service={view.service}
          country={view.country}
          balanceUsd={balanceUsd}
          onActivate={(activationId) => setView({ kind: 'activation', activationId: activationId as Id<'activations'> })}
          onBack={() => setView({ kind: 'countries', service: view.service })}
          onRecharge={() => openPanel('topup', { amount: view.country.priceXaf })}
        />
      )
    case 'countries':
      return (
        <CountryList
          service={view.service}
          countries={COUNTRIES}
          onSelect={(country) => setView({ kind: 'confirm', service: view.service, country })}
          onBack={() => setView({ kind: 'services' })}
        />
      )
    default:
      return (
        <ServiceList
          services={SERVICES}
          activeActivations={activeActivations}
          pastActivations={pastActivations}
          onSelect={(service) => setView({ kind: 'countries', service })}
          onActivationClick={(id) => setView({ kind: 'activation', activationId: id as Id<'activations'> })}
        />
      )
  }
}

// ─── ServiceList ──────────────────────────────────────────────────────────────

function ServiceList({
  services,
  activeActivations,
  pastActivations,
  onSelect,
  onActivationClick,
}: {
  services: Service[]
  activeActivations: SmsActivation[]
  pastActivations: SmsActivation[]
  onSelect: (s: Service) => void
  onActivationClick: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const filtered = search
    ? services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : services

  return (
    <div className="mx-auto max-w-7xl w-full h-dvh overflow-hidden flex flex-col">
      {/* ── Fixed header (search + title + historique) ── */}
      <div className="shrink-0 px-3 pt-4 md:px-6 md:pt-8">
        <input
          type="text"
          placeholder="Rechercher un service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full font-figtree text-[var(--sea-ink-soft)] text-[18px] font-medium tracking-[-0.04em] outline-none placeholder:text-[var(--sea-ink-soft)]/50 mb-4"
        />
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-figtree text-[var(--sea-ink-soft)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            Choisissez un service
          </h1>
          {pastActivations.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="relative inline-flex flex-col items-center cursor-pointer group"
            >
              <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider">
                {showHistory ? 'Fermer' : 'Historique'}
              </span>
              <svg
                className="w-full h-[4px]"
                viewBox="0 0 80 4"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M0,2 Q10,0 20,2 T40,2 T60,2 T80,2"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.35"
                  className="text-[var(--sea-ink-soft)]"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 md:px-6 md:pb-8">
        {activeActivations.length > 0 && (
          <div className="mb-8 space-y-2">
            <h2 className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-3">
              Activations en cours ({activeActivations.length})
            </h2>
            {activeActivations.map((act) => {
              const countryInfo = COUNTRIES.find((c) => c.iso === act.country)
              return (
                <button
                  key={act._id}
                  onClick={() => onActivationClick(act._id)}
                  className="w-full flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceBadge service={act.service} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{countryInfo?.flag ?? ''}</span>
                        <span className="truncate">{act.phoneNumber ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--sea-ink-soft)] text-[13px] font-semibold tracking-wider truncate">
                          {countryInfo?.name ?? act.country}
                        </span>
                        <span
                          className={`text-[13px] font-semibold uppercase tracking-wider shrink-0 ${STATUS_COLORS[act.status]}`}
                        >
                          {STATUS_LABELS[act.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider shrink-0 ml-2">
                    &rarr;
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {showHistory && pastActivations.length > 0 && (
          <div className="mb-8 space-y-2">
            <h2 className="font-figtree text-gray-400 text-[15px] font-semibold uppercase tracking-wider mb-3">
              Historique ({pastActivations.length})
            </h2>
            {pastActivations.map((act) => {
              const countryInfo = COUNTRIES.find((c) => c.iso === act.country)
              return (
                <button
                  key={act._id}
                  onClick={() => onActivationClick(act._id)}
                  className="w-full flex items-center justify-between font-figtree text-left text-gray-400 text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceBadge service={act.service} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{countryInfo?.flag ?? ''}</span>
                        <span className="truncate">{act.phoneNumber ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[13px] font-semibold tracking-wider truncate">
                          {countryInfo?.name ?? act.country}
                        </span>
                        <span
                          className={`text-[13px] font-semibold uppercase tracking-wider shrink-0 ${STATUS_COLORS[act.status]}`}
                        >
                          {STATUS_LABELS[act.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-500 text-[15px] font-semibold tracking-wider shrink-0 ml-2">
                    &rarr;
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="block text-[22px]">{s.name}</span>
              <span className="text-[var(--sea-ink-soft)] text-[12px] font-light capitalize">
                {s.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ServiceBadge({ service }: { service: string }) {
  const name = SERVICES.find((s) => s.id === service)?.name ?? service
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-[13px] font-semibold">
      {name.charAt(0)}
    </span>
  )
}

// ─── CountryList ──────────────────────────────────────────────────────────────

function CountryList({
  service,
  countries,
  onSelect,
  onBack,
}: {
  service: Service
  countries: CountryPrice[]
  onSelect: (c: CountryPrice) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : countries

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          &larr; Retour
        </button>
        <h1 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
          {service.name}
        </h1>
      </div>
      <input
        type="text"
        placeholder="Rechercher un pays…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none mb-4"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((c) => (
          <button
            key={c.iso}
            onClick={() => onSelect(c)}
            className="flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{c.flag}</span>
              <div>
                <span>{c.name}</span>
                <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-2">
                  {c.iso}
                </span>
              </div>
            </div>
            <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
              {c.priceXaf.toLocaleString('fr-FR')} FCFA
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── PurchaseConfirmation ─────────────────────────────────────────────────────

function PurchaseConfirmation({
  service,
  country,
  balanceUsd,
  onActivate,
  onBack,
  onRecharge,
}: {
  service: Service
  country: CountryPrice
  balanceUsd: number
  onActivate: (activationId: string) => void
  onBack: () => void
  onRecharge: () => void
}) {
  const initiateActivation = useInitiateActivation()
  const [error, setError] = useState<string | null>(null)

  const handleBuy = async () => {
    setError(null)

    if (balanceUsd < country.priceUsd) {
      setError(`Solde insuffisant. Il vous faut $${country.priceUsd.toFixed(2)}.`)
      return
    }

    try {
      const result = await initiateActivation.mutateAsync({
        service: service.id,
        country: country.iso,
      })
      onActivate(result.activationId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    }
  }

  const needsTopUp = balanceUsd < country.priceUsd

  return (
    <div className="mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12">
      <button
        onClick={onBack}
        className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer"
      >
        &larr; Retour
      </button>
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-4xl mb-2 block">{country.flag}</span>
          <h2 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            {service.name}
          </h2>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
            {country.name}
          </p>
        </div>

        <div className="text-center py-4">
          <span className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em]">
            {country.priceXaf.toLocaleString('fr-FR')}
          </span>
          <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-1">
            FCFA
          </span>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold mt-2">
            ${country.priceUsd.toFixed(2)} USD
          </p>
        </div>

        <div className="text-center">
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider">
            Solde: ${balanceUsd.toFixed(2)} USD
          </p>
        </div>

        {error && (
          <div className="text-center">
            <p className="font-figtree text-red-500 text-[15px] font-semibold">{error}</p>
          </div>
        )}

        {needsTopUp ? (
          <button
            onClick={onRecharge}
            className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer"
          >
            Recharger mon compte
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={initiateActivation.isPending}
            className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer disabled:opacity-40"
          >
            {initiateActivation.isPending ? 'Activation en cours…' : 'Acheter le numéro'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ActivationDetail ─────────────────────────────────────────────────────────

function ActivationDetail({
  activationId,
  onBack,
}: {
  activationId: Id<'activations'>
  onBack: () => void
}) {
  const { data: activation, isLoading } = useActivation(activationId)
  const completeActivation = useCompleteActivation()
  const cancelActivation = useCancelActivation()
  const requestSms = useRequestAnotherSms()
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-3 py-12 md:px-6 md:py-20 text-center">
        <p className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          Chargement…
        </p>
      </div>
    )
  }

  if (!activation) {
    return (
      <div className="mx-auto max-w-lg px-3 py-12 md:px-6 md:py-20 text-center">
        <p className="font-figtree text-red-500 text-[18px] font-medium tracking-[-0.04em]">
          Activation introuvable
        </p>
        <button
          onClick={onBack}
          className="mt-4 font-figtree text-[var(--sea-ink)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
        >
          &larr; Retour
        </button>
      </div>
    )
  }

  const serviceName = SERVICES.find((s) => s.id === activation.service)?.name ?? activation.service
  const countryInfo = COUNTRIES.find((c) => c.iso === activation.country)
  const isActive = isActiveStatus(activation.status)

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setActionError(null)
    setPendingAction(action)
    try {
      await fn()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12">
      <button
        onClick={onBack}
        className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer"
      >
        &larr; Mon espace
      </button>

      <div className="space-y-6">
        {/* Service + Country header */}
        <div className="text-center">
          <span className="text-4xl mb-2 block">{countryInfo?.flag ?? '🌍'}</span>
          <h2 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            {serviceName}
          </h2>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
            {countryInfo?.name ?? activation.country}
          </p>
        </div>

        {/* Status indicator */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isActive && (
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            )}
            <span
              className={`font-figtree text-[22px] font-medium tracking-[-0.04em] ${STATUS_COLORS[activation.status]}`}
            >
              {STATUS_LABELS[activation.status]}
            </span>
          </div>

          {(activation.status === 'awaiting_sms' || activation.status === 'sms_received') &&
            activation.phoneNumber && (
              <p className="font-figtree text-[var(--sea-ink)] text-[24px] font-medium tracking-[-0.04em] mt-2">
                {activation.phoneNumber}
              </p>
            )}

          {activation.status === 'sms_received' && activation.smsCode && (
            <div className="mt-4 inline-block px-6 py-3 rounded-lg bg-[var(--sea-ink)]/5">
              <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-1">
                Code SMS
              </p>
              <p className="font-figtree text-[var(--sea-ink)] text-[36px] font-medium tracking-[0.08em]">
                {activation.smsCode}
              </p>
            </div>
          )}

          {activation.errorMessage && (
            <p className="font-figtree text-red-500 text-[15px] font-semibold mt-4">
              {activation.errorMessage}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-3 text-sm">
          <TimelineLine
            done={!!activation.phoneNumber && activation.status !== 'awaiting_number'}
            active={!activation.phoneNumber || activation.status === 'awaiting_number'}
            label="Numéro attribué"
            value={activation.phoneNumber ?? 'En attente…'}
          />
          <TimelineLine
            done={activation.status === 'sms_received' || activation.status === 'completed'}
            active={
              activation.status === 'awaiting_sms' || activation.status === 'sms_received'
            }
            label="SMS reçu"
            value={activation.smsCode ?? undefined}
          />
          <TimelineLine
            done={activation.status === 'completed'}
            active={activation.status === 'completed'}
            label="Activation terminée"
          />
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex flex-col gap-3">
            {activation.status === 'sms_received' && (
              <button
                onClick={() => handleAction('complete', () => completeActivation.mutateAsync({ activationId }))}
                disabled={pendingAction !== null}
                className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer disabled:opacity-40"
              >
                {pendingAction === 'complete' ? 'Traitement…' : '✅ Confirmer le code'}
              </button>
            )}

            {activation.status === 'sms_received' && activation.canGetAnotherSms && (
              <button
                onClick={() => handleAction('resend', () => requestSms.mutateAsync({ activationId }))}
                disabled={pendingAction !== null}
                className="w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer disabled:opacity-40"
              >
                {pendingAction === 'resend' ? 'Traitement…' : '🔄 Redemander un SMS'}
              </button>
            )}

            {activation.status !== 'completed' && (
              <button
                onClick={() => handleAction('cancel', () => cancelActivation.mutateAsync({ activationId }))}
                disabled={pendingAction !== null}
                className="w-full font-figtree text-red-500 text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer disabled:opacity-40"
              >
                {pendingAction === 'cancel' ? 'Traitement…' : '✕ Annuler'}
              </button>
            )}
          </div>
        )}

        {actionError && (
          <p className="text-center font-figtree text-red-500 text-[15px] font-semibold">
            {actionError}
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineLine({
  done,
  active,
  label,
  value,
}: {
  done: boolean
  active?: boolean
  label: string
  value?: string
}) {
  const color = done ? 'text-[#25D366]' : active ? 'text-amber-500' : 'text-gray-400'
  return (
    <div className="flex items-center gap-3">
      <span className={`font-figtree text-[15px] font-semibold ${color}`}>
        {done ? '✓' : active ? '○' : '○'}
      </span>
      <div>
        <span className={`font-figtree text-[15px] font-semibold tracking-wider ${color}`}>
          {label}
        </span>
        {value && (
          <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] ml-2">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
