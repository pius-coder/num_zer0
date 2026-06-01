'use client'

import { useCallback, useState, useMemo } from 'react'
import { ServiceExplorer } from './service-explorer'
import { CountryDrawer } from './country-drawer'
import { ConfirmDialog } from './confirm-dialog'
import { ActivationsList } from './activations-list'
import { ActivationSheet } from './activation-sheet'
import { useInfiniteCountries, useActivationsList, useActivation } from '@/hooks/use-numbers'
import { getCountryByIso, getServiceBySlug } from '@/common/catalog'
import { toastManager } from '@/component/ui/toast'
import type { ServiceItem, CountryItem, SubProviderDetail } from '@/type/service'
import type { ActivationInfo } from '@/type/activation'

export type MySpaceTab = 'services' | 'numbers'

type ActivationSheetState = {
  open: boolean
  activationId: string | null
  phase: 'confirm' | 'waiting' | 'code-received'
}

export function MySpaceOrchestrator({
  initialServices,
  tab,
}: {
  initialServices: ServiceItem[]
  tab: MySpaceTab
}) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null)
  const [selectedSubProvider, setSelectedSubProvider] = useState<SubProviderDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activationSheetState, setActivationSheetState] = useState<ActivationSheetState>({
    open: false,
    activationId: null,
    phase: 'waiting',
  })

  const countries = useInfiniteCountries(selectedService?.slug ?? '')
  const activations = useActivationsList()
  const activation = useActivation(activationSheetState.activationId)

  const handleServiceSelect = useCallback((service: ServiceItem) => {
    setSelectedService(service)
    setDrawerOpen(true)
  }, [])

  const handleCountryBuy = useCallback((country: CountryItem) => {
    setSelectedCountry(country)
    setSelectedSubProvider(null)
  }, [])

  const handleSubProviderBuy = useCallback((country: CountryItem, sub: SubProviderDetail) => {
    setSelectedCountry(country)
    setSelectedSubProvider(sub)
  }, [])

  const handleActivationClose = useCallback(() => {
    setSelectedService(null)
    setSelectedCountry(null)
    setSelectedSubProvider(null)
    setDrawerOpen(false)
  }, [])

  const handleCountryDrawerClose = useCallback(() => {
    setDrawerOpen(false)
    setSelectedService(null)
    setSelectedCountry(null)
    setSelectedSubProvider(null)
  }, [])

  const handleConfirmDialogClose = useCallback(() => {
    setSelectedCountry(null)
    setSelectedSubProvider(null)
  }, [])

  const handleActivationsRefetch = useCallback(() => {
    activations.refetch()
  }, [activations])

  const openActivationSheet = useCallback(
    (activationId: string) => {
      const activation = activations.data?.items.find((a) => a.id === activationId)
      if (!activation) return

      const phase: ActivationSheetState['phase'] =
        activation.state === 'completed' && activation.smsCode ? 'code-received' : 'waiting'

      setActivationSheetState({
        open: true,
        activationId,
        phase,
      })
    },
    [activations.data]
  )

  const closeActivationSheet = useCallback(() => {
    setActivationSheetState({
      open: false,
      activationId: null,
      phase: 'waiting',
    })
  }, [])

  const handleCancelActivation = useCallback(async () => {
    try {
      await activation.cancel()
      toastManager.add({
        title: 'Demande annulée',
        description: "L'activation a été annulée avec succès.",
        type: 'success',
      })
      closeActivationSheet()
      activations.refetch()
    } catch {
      toastManager.add({
        title: "Impossible d'annuler",
        description: 'Veuillez réessayer.',
        type: 'error',
      })
    }
  }, [activation, closeActivationSheet, activations])

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        const isSmsCode = activationSheetState.phase === 'code-received'
        toastManager.add({
          type: 'success',
          title: isSmsCode ? 'Code copié!' : 'Numéro copié!',
        })
      } catch {
        // Silently fail - clipboard may not be available
      }
    },
    [activationSheetState.phase]
  )

  const selectedActivation = useMemo<ActivationInfo | undefined>(() => {
    if (!activationSheetState.activationId) return undefined
    return activations.data?.items.find((a) => a.id === activationSheetState.activationId)
  }, [activationSheetState.activationId, activations.data])

  const activationSheetData = useMemo(() => {
    if (!selectedActivation) return null

    const serviceMeta = getServiceBySlug(selectedActivation.serviceSlug)
    const countryMeta = getCountryByIso(selectedActivation.countryCode)

    return {
      serviceName: serviceMeta?.name ?? 'Unknown Service',
      countryCode: countryMeta?.name ?? selectedActivation.countryCode,
      phoneNumber: selectedActivation.phoneNumber,
      smsCode: selectedActivation.smsCode,
      price: selectedActivation.creditsCharged,
    }
  }, [selectedActivation])

  const serviceMeta = useMemo(
    () =>
      selectedService
        ? {
            slug: selectedService.slug,
            name: selectedService.name,
            icon: selectedService.icon ?? '/assets/services/ot.webp',
          }
        : null,
    [selectedService]
  )

  const countryName = useMemo(
    () =>
      selectedCountry
        ? (getCountryByIso(selectedCountry.countryIso)?.name ?? selectedCountry.countryIso)
        : '',
    [selectedCountry]
  )

  const allCountries = useMemo(
    () =>
      (countries.data as { pages: { items: CountryItem[] }[] } | undefined)?.pages.flatMap(
        (p) => p.items
      ) ?? [],
    [countries.data]
  )

  return (
    <>
      {tab === 'services' && (
        <>
          <ServiceExplorer initialData={initialServices} onServiceSelect={handleServiceSelect} />

          <CountryDrawer
            service={
              serviceMeta ?? {
                slug: '',
                name: '',
                icon: '/assets/services/ot.webp',
              }
            }
            countries={allCountries}
            isLoading={countries.isLoading}
            hasNextPage={!!countries.hasNextPage}
            isFetchingNextPage={countries.isFetchingNextPage}
            onFetchNextPage={countries.fetchNextPage}
            onClose={handleCountryDrawerClose}
            onCountryBuy={handleCountryBuy}
            onSubProviderBuy={handleSubProviderBuy}
            open={drawerOpen && !!serviceMeta}
          />

          {selectedCountry && serviceMeta && (
            <ConfirmDialog
              service={serviceMeta}
              country={selectedCountry}
              countryName={countryName}
              subProvider={selectedSubProvider}
              onClose={handleConfirmDialogClose}
              onSuccess={() => handleActivationClose()}
            />
          )}
        </>
      )}

      {tab === 'numbers' && (
        <ActivationsList
          activations={activations.data?.items ?? []}
          isLoading={activations.isLoading}
          onRefetch={handleActivationsRefetch}
          onActivationClick={openActivationSheet}
        />
      )}

      <ActivationSheet
        open={activationSheetState.open}
        onClose={closeActivationSheet}
        activationId={activationSheetState.activationId}
        phase={activationSheetState.phase}
        phoneNumber={activationSheetData?.phoneNumber ?? null}
        smsCode={activationSheetData?.smsCode ?? null}
        serviceName={activationSheetData?.serviceName}
        countryCode={activationSheetData?.countryCode}
        price={activationSheetData?.price}
        cancelEnabled={activation.cancelEnabled}
        onCancel={handleCancelActivation}
        onCopy={handleCopy}
      />
    </>
  )
}
