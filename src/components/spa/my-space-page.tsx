'use client'

import { useState } from 'react'
import { SERVICES, COUNTRIES, type Service, type CountryPrice } from '@/components/services/data'
import { useBottomNav } from '@/components/layout/bottom-nav-store'

export function MySpacePage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<CountryPrice | null>(null)

  if (selectedService && selectedCountry) {
    return (
      <PurchaseConfirmation
        service={selectedService}
        country={selectedCountry}
        onBack={() => setSelectedCountry(null)}
      />
    )
  }

  if (selectedService) {
    return (
      <CountryList
        service={selectedService}
        countries={COUNTRIES}
        onSelect={setSelectedCountry}
        onBack={() => setSelectedService(null)}
      />
    )
  }

  return <ServiceList services={SERVICES} onSelect={setSelectedService} />
}

function ServiceList({ services, onSelect }: { services: Service[]; onSelect: (s: Service) => void }) {
  return (
    <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
      <h1 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25] mb-6'>
        Choisissez un service
      </h1>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className='font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
          >
            <span className='block'>{s.name}</span>
            <span className='text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>{s.category}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

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
    <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
      <div className='flex items-center gap-3 mb-6'>
        <button onClick={onBack} className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider cursor-pointer'>&larr; Retour</button>
        <h1 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>{service.name}</h1>
      </div>
      <input
        type='text'
        placeholder='Rechercher un pays...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] outline-none mb-4'
      />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
        {filtered.map((c) => (
          <button
            key={c.iso}
            onClick={() => onSelect(c)}
            className='flex items-center justify-between font-figtree text-left text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
          >
            <div className='flex items-center gap-3'>
              <span className='text-xl'>{c.flag}</span>
              <div>
                <span>{c.name}</span>
                <span className='text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-2'>{c.iso}</span>
              </div>
            </div>
            <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>{c.priceXaf.toLocaleString('fr-FR')} FCFA</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PurchaseConfirmation({
  service,
  country,
  onBack,
}: {
  service: Service
  country: CountryPrice
  onBack: () => void
}) {
  const { openPanel } = useBottomNav()
  const handleBuy = () => openPanel('topup', { amount: country.priceXaf })

  return (
    <div className='mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12'>
      <button onClick={onBack} className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer'>&larr; Retour</button>
      <div className='space-y-6'>
        <div className='text-center'>
          <span className='text-4xl mb-2 block'>{country.flag}</span>
          <h2 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>{service.name}</h2>
          <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>{country.name}</p>
        </div>
        <div className='text-center py-4'>
          <span className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em]'>{country.priceXaf.toLocaleString('fr-FR')}</span>
          <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-1'>FCFA</span>
        </div>
        <button
          onClick={handleBuy}
          className='w-full font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] py-3 transition-all cursor-pointer'
        >
          Acheter le numéro
        </button>
      </div>
    </div>
  )
}
