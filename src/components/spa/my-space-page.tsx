'use client'

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import type { Service, CountryPrice } from '@/components/services/data'
import type { SmsActivation, SmsActivationStatus } from '@/type/sms_activation'
import type { Id } from '../../../convex/_generated/dataModel'
import { Spinner } from '#/common/spinner'
import { useBottomNav } from '@/components/layout/bottom-nav-store'
import {
  useInitiateActivation,
  useActivation,
  useMyActivations,
  useCompleteActivation,
  useCancelActivation,
  useRequestAnotherSms,
  useBalance,
  useOperators,
  usePrices,
  useNumberQuantity,
} from '@/components/purchases/hooks'

const FLAG_BASE = 'https://flagcdn.com'

type PageView =
  | { kind: 'services' }
  | { kind: 'history' }
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

const RENTAL_OPTIONS = [
  { label: '20 min', value: 20 },
  { label: '1 heure', value: 60 },
  { label: '4 heures', value: 240 },
  { label: '24 heures', value: 1440 },
]

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
    return <Spinner message="Chargement…" />
  }

  const activeActivations = (myActivations ?? []).filter((a) => isActiveStatus(a.status))
  const pastActivations = (myActivations ?? []).filter((a) => !isActiveStatus(a.status))
  const balanceUsd = balanceData?.balanceUsd ?? 0

  switch (view.kind) {
    case 'activation':
      return (
        <ActivationDetail
          activationId={view.activationId as Id<'activations'>}
          balanceUsd={balanceUsd}
          onBack={() => setView({ kind: 'services' })}
          onActivate={(activationId) => setView({ kind: 'activation', activationId: activationId as Id<'activations'> })}
          onRecharge={() => navigate({ to: '/recharge' })}
        />
      )
    case 'history':
      return (
        <HistoryView
          pastActivations={pastActivations}
          onActivationClick={(id) => setView({ kind: 'activation', activationId: id as Id<'activations'> })}
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
          onSelect={(service) => setView({ kind: 'countries', service })}
          onActivationClick={(id) => setView({ kind: 'activation', activationId: id as Id<'activations'> })}
          onHistoryClick={() => setView({ kind: 'history' })}
        />
      )
  }
}

// ─── ServiceList ──────────────────────────────────────────────────────────────

function ServiceList({
  services,
  activeActivations,
  onSelect,
  onActivationClick,
  onHistoryClick,
}: {
  services: Service[]
  activeActivations: SmsActivation[]
  onSelect: (s: Service) => void
  onActivationClick: (id: string) => void
  onHistoryClick: () => void
}) {
  const [search, setSearch] = useState('')
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
          <button
            onClick={onHistoryClick}
            className="relative inline-flex flex-col items-center cursor-pointer group"
          >
            <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold tracking-wider">
              Historique
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
                        {countryInfo?.code ? (
                          <img src={`${FLAG_BASE}/20x15/${countryInfo.code}.png`} width="20" height="15" alt="" className="shrink-0 block" loading="lazy" />
                        ) : null}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ServiceIcon serviceId={s.id} name={s.name} />
                <div>
                  <span>{s.name}</span>
                  <span className="text-[var(--sea-ink-soft)] text-[12px] font-light ml-2">
                    {s.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── HistoryView ──────────────────────────────────────────────────────────────

function HistoryView({
  pastActivations,
  onActivationClick,
  onBack,
}: {
  pastActivations: SmsActivation[]
  onActivationClick: (id: string) => void
  onBack: () => void
}) {
  return (
    <div className="mx-auto max-w-7xl w-full h-dvh overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 pt-4 md:px-6 md:pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer"
          >
            &larr; Mon espace
          </button>
          <h1 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            Historique
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 md:px-6 md:pb-8">
        {pastActivations.length === 0 ? (
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[18px] font-medium tracking-[-0.04em]">
            Aucune activation passée.
          </p>
        ) : (
          <div className="space-y-2">
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
                        {countryInfo?.code ? (
                          <img src={`${FLAG_BASE}/20x15/${countryInfo.code}.png`} width="20" height="15" alt="" className="shrink-0 block" loading="lazy" />
                        ) : null}
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
      </div>
    </div>
  )
}

// ─── ServiceIcon ──────────────────────────────────────────────────────────────

// Services that only have .svg icons (not .webp) — serve correct ext directly
const SVG_IDS = new Set([
  "az","bj","df","dt","dw","dx","dz","ee","eo","er","et","fp","fq","fu","fy",
  "gn","gs","gv","hd","hf","ia","ic","ie","il","jf","kj","lv","mc","mh","nq",
  "of","og","oh","op","pg","qc","qm","qz","rc","rl","sx","tj","tt","up","vf",
  "wl","yb","yu",
])

// Services without any icon file — skip img, render letter directly (no 404s)
const NO_ICON_IDS = new Set([
  "ac","af","an","aq","ar","at","av","aw","ax","ba","bb","bc","be","bf","bn",
  "bo","bp","br","bu","bw","cc","cm","cn","cr","cy","da","de","dg","dj","dr",
  "du","dv","eh","em","eq","es","eu","ev","fc","fd","ff","fh","fi","fj","ft",
  "full","fv","fx","gc","gg","gk","gt","gy","hh","hj","hs","ib","ih","ij","ik",
  "io","ir","iu","jc","je","ji","jr","js","kb","kd","ke","kh","kk","ko","kp",
  "kq","ks","kv","ky","lb","lj","lm","lo","ma","mg","ml","mn","mp","mt","mv",
  "mw","my","nb","nh","ni","nt","nu","nw","ob","ok","ov","pc","pl","pp","ps",
  "py","pz","qi","qj","qn","qr","qt","qy","rd","rj","rm","ro","rs","rw","rz",
  "sa","sb","sc","sd","se","sg","sh","sl","ss","st","sv","sy","th","tk","ui",
  "un","uu","uv","vd","vg","vj","vk","vr","we","wf","wg","wj","wn","wq","ws",
  "wt","xh","xj","xm","xn","xp","xr","xu","ya","yg","yh","yj","yk","ym","yo",
  "yp","yx","yz","zb","zi","zj","zo","zr","zs",
])

function IconLetter({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
      {name.charAt(0)}
    </span>
  )
}

function ServiceIcon({ serviceId, name }: { serviceId: string; name: string }) {
  if (NO_ICON_IDS.has(serviceId)) return <IconLetter name={name} />

  const preferredExt = SVG_IDS.has(serviceId) ? 'svg' : 'webp'
  const [ext, setExt] = useState(preferredExt)
  const [errored, setErrored] = useState(false)

  if (errored) return <IconLetter name={name} />

  return (
    <img
      src={`/assets/services/${serviceId}.${ext}`}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-[var(--sea-ink)]/5"
      loading="lazy"
      onError={() => {
        if (ext === 'webp') setExt('svg')
        else if (ext === 'svg') setExt('webp')
        else setErrored(true)
      }}
    />
  )
}

// ─── ServiceBadge ─────────────────────────────────────────────────────────────

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
  const q = search.toLowerCase()
  const filtered = search
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phonePrefix.replace('+', '').includes(q.replace('+', ''))
      )
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
              <img src={`${FLAG_BASE}/20x15/${c.code}.png`} width="20" height="15" alt="" className="shrink-0 block" loading="lazy" />
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

// ─── PurchaseOptionsInline (shared purchase panel) ──────────────────────────

function PurchaseOptionsInline({
  service,
  country,
  balanceUsd,
  onActivate,
  onRecharge,
}: {
  service: Service
  country: CountryPrice
  balanceUsd: number
  onActivate: (activationId: string) => void
  onRecharge: () => void
}) {
  const initiateActivation = useInitiateActivation()
  const [error, setError] = useState<string | null>(null)
  const { data: operatorsData } = useOperators(country.iso)
  const { data: quantityData } = useNumberQuantity(country.iso)
  const { data: pricesData } = usePrices(country.iso, service.id)
  const [operatorOpen, setOperatorOpen] = useState(false)
  const [selectedOp, setSelectedOp] = useState('any')
  const [maxPrice, setMaxPrice] = useState(country.priceUsd)
  const [rentalIdx, setRentalIdx] = useState(0)

  // operatorsData is string[] from the API — just operator names
  const operatorList: string[] = operatorsData?.length ? operatorsData : []
  const availableCount = quantityData?.[service.id] ?? 0

  // Real pricing from getPrices API: { [country]: { [service]: { cost, count } } }
  // pricesData example: { "1": { "wa": { cost: 2.42, count: 17 } } }
  const apiPrice = (() => {
    if (!pricesData) return null
    // pricesData is { [numericCountryCode]: { [service]: { cost, count } } }
    for (const countryKey of Object.keys(pricesData)) {
      const services = pricesData[countryKey]
      if (services?.[service.id]) return services[service.id]
    }
    return null
  })()

  // Use API price as base, fall back to country price from local data
  const basePrice = apiPrice?.cost ?? country.priceUsd
  const serviceCount = apiPrice?.count ?? availableCount
  const tiers = [
    { label: 'Standard', price: basePrice, count: serviceCount },
    { label: 'Prioritaire', price: Math.round(basePrice * 1.1 * 10000) / 10000, count: Math.max(1, Math.floor(serviceCount * 0.4)) },
    { label: 'Premium', price: Math.round(basePrice * 1.3 * 10000) / 10000, count: Math.max(0, Math.floor(serviceCount * 0.1)) },
  ]
  const [selectedTierIdx, setSelectedTierIdx] = useState(0)
  const selectedTier = tiers[selectedTierIdx]

  // Keep maxPrice in sync with selected tier
  const displayPrice = Math.max(selectedTier.price, maxPrice)

  const needsTopUp = balanceUsd < displayPrice

  const handleBuy = async () => {
    setError(null)
    if (balanceUsd < displayPrice) {
      setError(`Solde insuffisant. Il vous faut $${displayPrice.toFixed(2)}.`)
      return
    }
    try {
      const result = await initiateActivation.mutateAsync({
        service: service.id,
        country: country.iso,
        maxPrice: displayPrice,
        operator: selectedOp === 'any' ? undefined : selectedOp,
      })
      onActivate(result.activationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="rounded-[18px] bg-[#121212] border border-[var(--line)]/50 backdrop-blur-xl p-5 space-y-5 shadow-[0_26px_75px_rgba(0,0,0,0.42)]">
      {/* Service + Country header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`${FLAG_BASE}/24x18/${country.code}.png`} width="24" height="18" alt="" className="shrink-0 block" loading="lazy" />
          <div>
            <span className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
              {service.name}
            </span>
            <span className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider block">
              {country.name}
            </span>
          </div>
        </div>
        <span className="font-figtree text-white/65 text-[15px] font-semibold">
          ${balanceUsd.toFixed(2)}
        </span>
      </div>

      {/* Opérateur dropdown */}
      <div className="relative">
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block mb-2">
          Opérateur
        </label>
        <button
          onClick={() => setOperatorOpen(!operatorOpen)}
          className="w-full flex items-center justify-between font-figtree text-white text-[18px] font-medium tracking-[-0.04em] bg-white/5 rounded-[14px] px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <span>{selectedOp === 'any' ? 'Tous les opérateurs' : selectedOp}</span>
          <svg className={`w-4 h-4 text-white/65 transition-transform duration-200 ${operatorOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {operatorOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOperatorOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-[#1a1a1a] rounded-[14px] border border-white/10 overflow-hidden shadow-xl">
              <button
                key="any"
                onClick={() => { setSelectedOp('any'); setOperatorOpen(false); setSelectedTierIdx(0) }}
                className={`w-full flex items-center justify-between px-4 py-3 font-figtree text-[15px] font-semibold cursor-pointer transition-colors hover:bg-white/5 ${
                  selectedOp === 'any' ? 'text-[#F97316] bg-white/5' : 'text-white'
                }`}
              >
                <span>Tous les opérateurs</span>
                <span className="text-white/45">{availableCount} pcs</span>
              </button>
              {operatorList.map((op) => (
                <button
                  key={op}
                  onClick={() => { setSelectedOp(op); setOperatorOpen(false); setSelectedTierIdx(0) }}
                  className={`w-full flex items-center justify-between px-4 py-3 font-figtree text-[15px] font-semibold cursor-pointer transition-colors hover:bg-white/5 ${
                    selectedOp === op ? 'text-[#F97316] bg-white/5' : 'text-white'
                  }`}
                >
                  <span>{op}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paliers de prix */}
      <div>
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block mb-3">
          Prix
        </label>
        <div className="grid grid-cols-3 gap-2">
          {tiers.map((tier, i) => (
            <button
              key={tier.label}
              onClick={() => { setSelectedTierIdx(i); setMaxPrice(tier.price) }}
              className={`rounded-[14px] p-3 text-center transition-all cursor-pointer ${
                selectedTierIdx === i
                  ? 'bg-[#F97316]/20 border-2 border-[#F97316] shadow-[0_0_20px_-4px_#F97316]'
                  : 'bg-white/5 border border-white/10 hover:border-white/30'
              }`}
            >
              <span className={`font-figtree text-[18px] font-medium tracking-[-0.04em] block ${
                selectedTierIdx === i ? 'text-[#F97316]' : 'text-white'
              }`}>
                ${tier.price.toFixed(4)}
              </span>
              <span className={`font-figtree text-[13px] font-semibold ${
                selectedTierIdx === i ? 'text-[#F97316]/70' : 'text-white/45'
              }`}>
                {tier.count} pcs
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stepper maxPrice */}
      <div>
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block mb-2">
          Prix max
        </label>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => setMaxPrice((p) => Math.max(0.01, Math.round((p - 0.01) * 100) / 100))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            −
          </button>
          <span className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] min-w-[120px] text-center">
            ${displayPrice.toFixed(2)}
          </span>
          <button
            onClick={() => setMaxPrice((p) => Math.round((p + 0.01) * 100) / 100)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Durée de location */}
      <div>
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block mb-2">
          Durée de location
        </label>
        <div className="flex gap-2">
          {RENTAL_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => setRentalIdx(i)}
              className={`font-figtree text-[15px] font-semibold tracking-wider px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                rentalIdx === i
                  ? 'bg-[#F97316] text-white shadow-[0_0_20px_-4px_#F97316]'
                  : 'text-white/65 border border-[#292929] hover:border-white/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider">
          Total
        </span>
        <span className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em]">
          ${displayPrice.toFixed(2)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="font-figtree text-red-500 text-[15px] font-semibold text-center">{error}</p>
      )}

      {/* CTA */}
      <button
        onClick={needsTopUp ? onRecharge : handleBuy}
        disabled={initiateActivation.isPending}
        className="w-full py-3 rounded-[14px] bg-[#F97316] font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all duration-200 anim-glow-pulse"
      >
        {initiateActivation.isPending ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Activation…
          </span>
        ) : needsTopUp ? (
          'Recharger mon compte'
        ) : (
          'Acheter le numéro'
        )}
      </button>
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
  return (
    <div className="mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12">
      <button
        onClick={onBack}
        className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer"
      >
        &larr; Mon espace
      </button>
      <PurchaseOptionsInline
        service={service}
        country={country}
        balanceUsd={balanceUsd}
        onActivate={onActivate}
        onRecharge={onRecharge}
      />
    </div>
  )
}

// ─── ActivationDetail ─────────────────────────────────────────────────────────

function ActivationDetail({
  activationId,
  balanceUsd,
  onBack,
  onActivate,
  onRecharge,
}: {
  activationId: Id<'activations'>
  balanceUsd: number
  onBack: () => void
  onActivate: (activationId: string) => void
  onRecharge: () => void
}) {
  const { data: activation, isLoading } = useActivation(activationId)
  const completeActivation = useCompleteActivation()
  const cancelActivation = useCancelActivation()
  const requestSms = useRequestAnotherSms()
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  if (isLoading) {
    return <Spinner message="Chargement…" />
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

  const serviceObj = SERVICES.find((s) => s.id === activation.service)
  const countryInfo = COUNTRIES.find((c) => c.iso === activation.country)
  const serviceName = serviceObj?.name ?? activation.service
  const isActive = isActiveStatus(activation.status)
  const isTerminalError =
    activation.status === 'no_numbers' ||
    activation.status === 'expired' ||
    activation.status === 'cancelled' ||
    activation.status === 'max_price_too_low'

  // Determine error context message
  const errorContextMsg = (() => {
    if (activation.errorMessage === 'Annulé par l\'utilisateur') {
      return 'Vous avez annulé cette activation. Vous pouvez réessayer ci-dessous.'
    }
    if (activation.errorMessage === 'Annulé par le fournisseur') {
      return 'Le fournisseur a annulé cette activation. Aucun numéro disponible pour cet opérateur.'
    }
    switch (activation.status) {
      case 'no_numbers':
        return 'Aucun numéro disponible pour ce service en ce moment.'
      case 'expired':
        return 'Le délai d\'activation a expiré. Vous pouvez réessayer ci-dessous.'
      case 'max_price_too_low':
        return 'Le prix proposé est trop bas pour ce service.'
      case 'cancelled':
        return 'Cette activation a été annulée.'
      default:
        return "Cette activation n'a pas pu aboutir."
    }
  })()

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
        className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer"
      >
        &larr; Mon espace
      </button>

      <div className="space-y-6">
        {/* Service + Country header */}
        <div className="text-center">
          {countryInfo?.code ? (
            <img src={`${FLAG_BASE}/36x27/${countryInfo.code}.png`} width="36" height="27" alt="" className="mx-auto block" loading="lazy" />
          ) : (
            <span className="text-4xl mb-2 block">{'🌍'}</span>
          )}
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
              <p className="font-figtree text-white text-[24px] font-medium tracking-[-0.04em] mt-2">
                {activation.phoneNumber}
              </p>
            )}

          {activation.status === 'sms_received' && activation.smsCode && (
            <div className="mt-4 inline-block px-6 py-3 rounded-lg bg-white/5">
              <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-1">
                Code SMS
              </p>
              <p className="font-figtree text-white text-[36px] font-medium tracking-[0.08em]">
                {activation.smsCode}
              </p>
            </div>
          )}

          {/* Show error message */}
          {activation.errorMessage && !isActive && (
            <p className="font-figtree text-red-500 text-[15px] font-semibold mt-4">
              {activation.errorMessage}
            </p>
          )}
        </div>

        {/* TERMINAL ERROR → show inline purchase options (not "Réessayer" nav) */}
        {isTerminalError && serviceObj && countryInfo ? (
          <div className="space-y-4">
            <p className="font-figtree text-white/65 text-[15px] font-semibold text-center">
              {errorContextMsg}
            </p>
            <PurchaseOptionsInline
              service={serviceObj}
              country={countryInfo}
              balanceUsd={balanceUsd}
              onActivate={onActivate}
              onRecharge={onRecharge}
            />
          </div>
        ) : !isTerminalError && (
          <>
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

            {/* Active actions */}
            {isActive && (
              <div className="flex flex-col gap-3">
                {activation.status === 'sms_received' && (
                  <button
                    onClick={() => handleAction('complete', () => completeActivation.mutateAsync({ activationId }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] py-3 rounded-[14px] bg-[#F97316] cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    {pendingAction === 'complete' ? 'Traitement…' : 'Confirmer le code'}
                  </button>
                )}

                {activation.status === 'sms_received' && activation.canGetAnotherSms && (
                  <button
                    onClick={() => handleAction('resend', () => requestSms.mutateAsync({ activationId }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-white/65 text-[18px] font-medium tracking-[-0.04em] py-3 rounded-[14px] border border-white/10 cursor-pointer disabled:opacity-40 hover:bg-white/5 transition-all"
                  >
                    {pendingAction === 'resend' ? 'Traitement…' : 'Redemander un SMS'}
                  </button>
                )}

                {activation.status !== 'completed' && (
                  <button
                    onClick={() => handleAction('cancel', () => cancelActivation.mutateAsync({ activationId }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-red-500 text-[18px] font-medium tracking-[-0.04em] py-3 cursor-pointer disabled:opacity-40 hover:text-red-400 transition-all"
                  >
                    {pendingAction === 'cancel' ? 'Traitement…' : 'Annuler'}
                  </button>
                )}
              </div>
            )}
          </>
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
