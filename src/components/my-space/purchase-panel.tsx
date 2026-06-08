'use client'

import { useEffect, useMemo, useState } from 'react'
import { FLAG_BASE } from './constants'
import { getDefaultMarginXaf } from './utils'
import { OperatorSelector } from './operator-selector'
import { PriceStepper } from './price-stepper'
import { RentalOptions } from './rental-options'
import {
  useInitiateActivation,
  useInitiateRentalActivation,
  useOperators,
  useNumberQuantity,
  usePrices,
  useRentPriceList,
  useFreePrices,
} from '@/components/purchases/hooks'
import { useWalletBalance, useXafUsdRate } from '@/components/wallet/hooks'
import type { Service, CountryPrice } from '@/components/services/data'

type PurchaseMode = 'one-time' | 'subscription'

interface PurchasePanelProps {
  service: Service
  country: CountryPrice
  onActivate: (activationId: string) => void
  onRecharge: () => void
}

interface ModeToggleProps {
  mode: PurchaseMode
  onChange: (mode: PurchaseMode) => void
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-[16px] bg-white/5 p-1">
      <button
        type="button"
        onClick={() => onChange('one-time')}
        className={`rounded-[12px] px-3 py-2 font-figtree text-[15px] font-semibold tracking-wider transition-all ${
          mode === 'one-time'
            ? 'bg-[#F97316] text-white shadow-[0_0_20px_-4px_#F97316]'
            : 'text-white/65 hover:text-white'
        }`}
      >
        Utilisation unique
      </button>
      <button
        type="button"
        onClick={() => onChange('subscription')}
        className={`rounded-[12px] px-3 py-2 font-figtree text-[15px] font-semibold tracking-wider transition-all ${
          mode === 'subscription'
            ? 'bg-[#F97316] text-white shadow-[0_0_20px_-4px_#F97316]'
            : 'text-white/65 hover:text-white'
        }`}
      >
        Abonnement
      </button>
    </div>
  )
}

interface PanelHeaderProps {
  serviceName: string
  countryName: string
  countryCode: string
  balanceUsd: number
  availableLabel: string
}

function PanelHeader({
  serviceName,
  countryName,
  countryCode,
  balanceUsd,
  availableLabel,
}: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={`${FLAG_BASE}/24x18/${countryCode}.png`}
          width="24"
          height="18"
          alt=""
          className="block shrink-0"
          loading="lazy"
        />
        <div className="min-w-0">
          <span className="block truncate font-figtree text-[30px] font-medium leading-[1.15] tracking-[-0.04em] text-white">
            {serviceName}
          </span>
          <span className="block font-figtree text-[15px] font-semibold uppercase tracking-wider text-white/65">
            {countryName}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="block font-figtree text-[15px] font-semibold text-white/65">
          ${balanceUsd.toFixed(2)}
        </span>
        <span className="block font-figtree text-[11px] font-semibold uppercase tracking-wider text-white/45">
          {availableLabel}
        </span>
      </div>
    </div>
  )
}

interface PriceSummaryProps {
  value: number
}

function PriceSummary({ value }: PriceSummaryProps) {
  return (
    <div className="text-right font-figtree text-[30px] font-medium tracking-[-0.04em] text-white">
      ${value.toFixed(2)}
    </div>
  )
}

interface ActionButtonProps {
  pending: boolean
  needsTopUp: boolean
  onClick: () => void
  onRecharge: () => void
}

function ActionButton({ pending, needsTopUp, onClick, onRecharge }: ActionButtonProps) {
  const label = pending ? (
    <span className="inline-flex items-center justify-center gap-2">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Activation…
    </span>
  ) : needsTopUp ? (
    'Recharger mon compte'
  ) : (
    'Acheter le numéro'
  )

  return (
    <button
      type="button"
      onClick={needsTopUp ? onRecharge : onClick}
      disabled={pending}
      className="w-full rounded-[14px] bg-[#F97316] py-3 font-figtree text-[18px] font-semibold tracking-[-0.04em] text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 anim-glow-pulse"
    >
      {label}
    </button>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-[18px] w-6 animate-pulse rounded bg-[var(--sea-ink-mist)]" />
        <div className="h-8 w-32 animate-pulse rounded bg-[var(--sea-ink-mist)]" />
      </div>
      <div className="h-28 animate-pulse rounded-[18px] bg-white/5" />
      <div className="h-14 animate-pulse rounded-[18px] bg-white/5" />
    </div>
  )
}

function UnavailableState() {
  return (
    <p className="font-figtree text-[18px] text-[var(--sea-ink-soft)]">
      Prix non disponible pour ce service dans ce pays.
    </p>
  )
}

export function PurchasePanel({
  service,
  country,
  onActivate,
  onRecharge,
}: PurchasePanelProps) {
  const { data: balanceData } = useWalletBalance()
  const { data: rateData } = useXafUsdRate()
  const XAF_USD_RATE = rateData?.rate ?? 600
  const balanceUsd = balanceData?.balanceUsd ?? 0
  const initiateActivation = useInitiateActivation()
  const initiateRental = useInitiateRentalActivation()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<PurchaseMode>('one-time')
  const [selectedOp, setSelectedOp] = useState('any')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [rentalIdx, setRentalIdx] = useState(0)

  const { data: operatorsData } = useOperators(country.iso)
  const { data: quantityData } = useNumberQuantity(country.iso)
  const {
    data: pricesData,
    isFetching: priceLoading,
    isError: priceError,
  } = usePrices(country.iso, service.id)
  const { data: rentPrices, isFetching: rentLoading } = useRentPriceList(country.iso, service.id)
  const { data: freePricesData } = useFreePrices(country.iso, service.id)

  const operatorList: string[] = operatorsData?.length ? operatorsData : []
  const availableCount =
    (Array.isArray(quantityData)
      ? quantityData.find(([serviceId]) => serviceId === service.id)?.[1]
      : undefined) ?? 0

  const apiPrice = useMemo(() => {
    if (!pricesData) return null
    for (const countryKey of Object.keys(pricesData)) {
      const services = pricesData[countryKey]
      if (services?.[service.id]) return services[service.id]
    }
    return null
  }, [pricesData, service.id])

  const basePrice = apiPrice?.cost ?? null
  const serviceCount = apiPrice?.count ?? availableCount
  const marginXaf = apiPrice?.cost ? getDefaultMarginXaf(apiPrice.cost) : 0
  const marginUsd = marginXaf / XAF_USD_RATE
  const defaultPrice =
    basePrice !== null ? Math.round((basePrice + marginUsd) * 10000) / 10000 : null

  useEffect(() => {
    if (defaultPrice !== null && maxPrice === null) setMaxPrice(defaultPrice)
  }, [defaultPrice, maxPrice])

  const rentalOptions = useMemo(() => {
    const options = [{ label: '20 min', hours: 0, cost: maxPrice ?? defaultPrice ?? 0 }]
    if (rentPrices) {
      for (const rental of rentPrices) {
        options.push({ label: rental.label, hours: rental.hours, cost: rental.cost })
      }
    }
    return options
  }, [rentPrices, maxPrice, defaultPrice])

  const activeRental = rentalOptions[rentalIdx]
  const displayPrice =
    mode === 'subscription' ? (activeRental?.cost ?? 0) : (maxPrice ?? defaultPrice ?? 0)
  const needsTopUp = balanceUsd < displayPrice
  const isPending = initiateActivation.isPending || initiateRental.isPending

  const handleBuy = async () => {
    setError(null)

    if (basePrice === null) {
      setError('Prix non disponible. Réessayez plus tard.')
      return
    }

    if (balanceUsd < displayPrice) {
      setError(`Solde insuffisant. Il vous faut $${displayPrice.toFixed(2)}.`)
      return
    }

    try {
      if (mode === 'subscription' && rentalIdx > 0) {
        const rentalOpt = rentalOptions[rentalIdx]
        const result = await initiateRental.mutateAsync({
          service: service.id,
          country: country.iso,
          rentTimeHours: rentalOpt.hours,
          maxPrice: displayPrice,
          operator: selectedOp === 'any' ? undefined : selectedOp,
        })
        onActivate(result.activationId)
        return
      }

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

  if (priceLoading && !pricesData) return <LoadingState />
  if (priceError || (!priceLoading && !apiPrice)) return <UnavailableState />

  return (
    <div className="space-y-4">
      <PanelHeader
        serviceName={service.name}
        countryName={country.name}
        countryCode={country.code}
        balanceUsd={balanceUsd}
        availableLabel="20 min"
      />

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === 'one-time' ? (
        <PriceStepper
          displayPrice={maxPrice ?? defaultPrice ?? 0}
          defaultPrice={defaultPrice}
          onMaxPriceChange={setMaxPrice}
          serviceCount={serviceCount}
          freePrices={freePricesData?.freePriceMap}
        />
      ) : rentLoading && !rentPrices ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-white/5" />
          ))}
        </div>
      ) : (
        <RentalOptions
          rentalOptions={rentalOptions}
          selectedIndex={rentalIdx}
          onSelect={setRentalIdx}
        />
      )}

      <OperatorSelector
        operators={operatorList}
        selectedOp={selectedOp}
        onSelect={setSelectedOp}
        availableCount={availableCount}
      />
      <p className="-mt-2 font-figtree text-[12px] text-white/40">
        Changez le prix si l'achat échoue
      </p>

      <PriceSummary value={displayPrice} />

      {error && (
        <p className="text-center font-figtree text-[15px] font-semibold text-red-500">{error}</p>
      )}

      <ActionButton
        pending={isPending}
        needsTopUp={needsTopUp}
        onClick={handleBuy}
        onRecharge={onRecharge}
      />
    </div>
  )
}
