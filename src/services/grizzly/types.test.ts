import { describe, it, expect } from 'bun:test'
import type {
  GrizzlyCountryItem,
  GrizzlyServiceItem,
  PricesV3Raw,
  FlatPriceV3Row,
  PriceV3FilterOptions,
  CountryFilterOptions,
  ServiceFilterOptions,
  PaginationOptions,
  PaginatedResult,
  ProviderInfo,
  PriceV3Entry,
} from './types'

describe('Grizzly Types', () => {
  describe('GrizzlyCountryItem', () => {
    it('has correct shape', () => {
      const country: GrizzlyCountryItem = {
        id: 33,
        eng: 'France',
        rus: 'Франция',
        chn: '法国',
      }
      expect(country.id).toBe(33)
      expect(country.eng).toBe('France')
    })
  })

  describe('GrizzlyServiceItem', () => {
    it('has correct shape', () => {
      const service: GrizzlyServiceItem = {
        code: 'wa',
        name: 'WhatsApp',
      }
      expect(service.code).toBe('wa')
      expect(service.name).toBe('WhatsApp')
    })
  })

  describe('PricesV3Raw', () => {
    it('accepts valid price structure', () => {
      const raw: PricesV3Raw = {
        '78': {
          wa: {
            price: 0.1,
            count: 100,
            providers: {
              '1': { count: 50, price: [0.1], provider_id: 1 },
            },
          },
        },
      }
      expect(raw['78']['wa'].price).toBe(0.1)
    })

    it('allows null providers', () => {
      const raw: PricesV3Raw = {
        '78': {
          wa: { price: 0.1, count: 100, providers: null },
        },
      }
      expect(raw['78']['wa'].providers).toBeNull()
    })
  })

  describe('FlatPriceV3Row', () => {
    it('has correct shape from flatten', () => {
      const row: FlatPriceV3Row = {
        country: '78',
        service: 'wa',
        price: 0.1,
        count: 100,
        providers: [{ count: 50, price: [0.1], provider_id: 1 }],
      }
      expect(row.country).toBe('78')
      expect(row.providers.length).toBe(1)
    })
  })

  describe('Filter Options', () => {
    it('PriceV3FilterOptions accepts all fields', () => {
      const filters: PriceV3FilterOptions = {
        country: '78',
        service: 'wa',
        minCost: 0.1,
        maxCost: 1.0,
        minCount: 10,
        providerId: 1,
        minProviderCount: 5,
      }
      expect(filters.providerId).toBe(1)
    })

    it('PriceV3FilterOptions allows string arrays', () => {
      const filters: PriceV3FilterOptions = {
        country: ['78', '80'],
        service: ['wa', 'tg'],
      }
      expect(Array.isArray(filters.country)).toBe(true)
    })

    it('ServiceFilterOptions accepts query and codes', () => {
      const filters: ServiceFilterOptions = {
        query: 'whats',
        codes: ['wa', 'tg'],
      }
      expect(filters.query).toBe('whats')
    })

    it('CountryFilterOptions accepts query and ids', () => {
      const filters: CountryFilterOptions = {
        query: 'france',
        ids: [33, 1],
      }
      expect(filters.ids?.length).toBe(2)
    })
  })

  describe('Pagination Options', () => {
    it('PaginationOptions has correct fields', () => {
      const opts: PaginationOptions = {
        page: 2,
        pageSize: 20,
      }
      expect(opts.page).toBe(2)
    })

    it('PaginationOptions fields are optional', () => {
      const opts: PaginationOptions = {}
      expect(opts.page).toBeUndefined()
    })
  })

  describe('PaginatedResult', () => {
    it('has all required fields', () => {
      const result: PaginatedResult<string> = {
        data: ['a', 'b'],
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
      expect(result.data.length).toBe(2)
      expect(result.hasNext).toBe(false)
    })
  })

  describe('ProviderInfo', () => {
    it('has correct shape', () => {
      const info: ProviderInfo = {
        count: 50,
        price: [0.1, 0.15],
        provider_id: 1,
      }
      expect(info.price.length).toBe(2)
    })
  })

  describe('PriceV3Entry', () => {
    it('has correct shape', () => {
      const entry: PriceV3Entry = {
        price: 0.1,
        count: 100,
        providers: { '1': { count: 50, price: [0.1], provider_id: 1 } },
      }
      expect(entry.price).toBe(0.1)
    })
  })
})
