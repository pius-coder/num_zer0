'use client'

import { useCallback, useState, useMemo } from 'react'
import { ServiceExplorer } from './service-explorer'
import { CountryDrawer } from './country-drawer'
import { ConfirmDialog } from './confirm-dialog'
import { ActivationsList } from './activations-list'
import { useInfiniteCountries, useActivationsList } from '@/hooks/use-numbers'
import { getCountryByIso } from '@/common/catalog'
import type { ServiceItem, CountryItem, SubProviderDetail } from '@/type/service'

export type MySpaceTab = 'services' | 'numbers'

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

  const countries = useInfiniteCountries(selectedService?.slug ?? '')
  const activations = useActivationsList()

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
    () => countries.data?.pages.flatMap((p) => p.items) ?? [],
    [countries.data?.pages]
  )

  return (
    <>
      {tab === 'services' && (
        <>
          <ServiceExplorer initialData={initialServices} onServiceSelect={handleServiceSelect} />

          <CountryDrawer
            service={serviceMeta ?? { slug: '', name: '', icon: '/assets/services/ot.webp' }}
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
        />
      )}
    </>
  )
}
