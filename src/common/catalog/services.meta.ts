import servicesData from '@/../public/registry/grizzly-services.json'
import countriesData from '@/../public/registry/grizzly-countries.json'
import { categorize, titleCase, type ServiceCategory } from './categories'

export type { ServiceCategory } from './categories'

export interface ServiceMeta {
  externalId: string
  slug: string
  name: string
  nameFr: string
  nameEn: string
  category: ServiceCategory
  icon: string
  grizzlyId: number
  iconId: number
}

export interface CountryMeta {
  externalId: string
  slug: string
  name: string
  icon: string
  iconId: number
}

function buildServiceRegistry(): Record<string, ServiceMeta> {
  const registry: Record<string, ServiceMeta> = {}
  for (const svc of servicesData.services) {
    registry[svc.externalId] = {
      externalId: svc.externalId,
      slug: svc.slug,
      name: svc.name,
      nameFr: titleCase(svc.name),
      nameEn: titleCase(svc.name),
      category: categorize(svc.slug),
      icon: svc.iconLocalPath,
      grizzlyId: svc.grizzlyId,
      iconId: svc.iconId,
    }
  }
  return registry
}

function buildCountryRegistry(): Record<string, CountryMeta> {
  const registry: Record<string, CountryMeta> = {}
  for (const c of countriesData.countries) {
    registry[c.externalId] = {
      externalId: c.externalId,
      slug: c.slug,
      name: c.name,
      icon: c.iconLocalPath,
      iconId: c.iconId,
    }
  }
  return registry
}

export const SERVICE_REGISTRY = buildServiceRegistry()
export const COUNTRY_REGISTRY = buildCountryRegistry()

export function getServiceMeta(externalId: string): ServiceMeta | undefined {
  return SERVICE_REGISTRY[externalId]
}

export function getServiceBySlug(slug: string): ServiceMeta | undefined {
  return Object.values(SERVICE_REGISTRY).find((s) => s.slug === slug)
}

export function getAllServices(): ServiceMeta[] {
  return Object.values(SERVICE_REGISTRY)
}

export function getServicesByCategory(category: ServiceCategory): ServiceMeta[] {
  return Object.values(SERVICE_REGISTRY).filter((s) => s.category === category)
}

export function getCountryMeta(externalId: string): CountryMeta | undefined {
  return COUNTRY_REGISTRY[externalId]
}

export function getCountryBySlug(slug: string): CountryMeta | undefined {
  return Object.values(COUNTRY_REGISTRY).find((c) => c.slug === slug)
}

export function getCountryByIso(isoCode: string): CountryMeta | undefined {
  return COUNTRY_REGISTRY[isoCode]
}

export function getAllCountries(): CountryMeta[] {
  return Object.values(COUNTRY_REGISTRY)
}

export function searchServices(query: string): ServiceMeta[] {
  const q = query.toLowerCase()
  return Object.values(SERVICE_REGISTRY).filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.externalId.toLowerCase().includes(q)
  )
}

export function searchCountries(query: string): CountryMeta[] {
  const q = query.toLowerCase()
  return Object.values(COUNTRY_REGISTRY).filter(
    (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
  )
}
