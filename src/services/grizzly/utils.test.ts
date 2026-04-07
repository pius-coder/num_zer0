import { describe, it, expect } from 'bun:test';
import {
  paginate,
  flattenPricesV3,
  filterPricesV3,
  filterServices,
  filterCountries,
  sortBy,
} from './utils';
import type { PricesV3Raw, GrizzlyServiceItem, GrizzlyCountryItem } from './types';

describe('Grizzly Utils', () => {
  describe('paginate', () => {
    it('paginates an array correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const result = paginate(items, { page: 2, pageSize: 20 });
      expect(result.data.length).toBe(20);
      expect(result.data[0]).toBe(20);
      expect(result.page).toBe(2);
      expect(result.totalItems).toBe(100);
      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('handles out of bounds page gracefully', () => {
      const items = [1, 2, 3];
      const result = paginate(items, { page: 5, pageSize: 10 });
      expect(result.data.length).toBe(3);
      expect(result.page).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('flattenPricesV3', () => {
    it('flattens PricesV3Raw correctly', () => {
      const raw: PricesV3Raw = {
        '78': {
          'wa': {
            price: 0.1,
            count: 100,
            providers: {
              '1': { count: 50, price: [0.1], provider_id: 1 },
              '2': { count: 50, price: [0.1], provider_id: 2 },
            },
          },
          'tg': {
            price: 0.2,
            count: 200,
            providers: null,
          },
        },
      };

      const flattened = flattenPricesV3(raw);
      expect(flattened.length).toBe(2);
      expect(flattened[0].country).toBe('78');
      expect(flattened[0].service).toBe('wa');
      expect(flattened[0].providers.length).toBe(2);
      expect(flattened[1].service).toBe('tg');
      expect(flattened[1].providers).toEqual([]);
    });
  });

  describe('filterPricesV3', () => {
    it('filters prices correctly', () => {
      const raw: PricesV3Raw = {
        '78': {
          'wa': { price: 0.1, count: 100, providers: null },
          'tg': { price: 0.2, count: 200, providers: null },
        },
        '80': {
          'wa': { price: 0.15, count: 50, providers: null },
        },
      };
      const flat = flattenPricesV3(raw);

      const filteredByService = filterPricesV3(flat, { service: 'wa' });
      expect(filteredByService.length).toBe(2);

      const filteredByCountry = filterPricesV3(flat, { country: '78' });
      expect(filteredByCountry.length).toBe(2);

      const filteredByCost = filterPricesV3(flat, { minCost: 0.15 });
      expect(filteredByCost.length).toBe(2); // 0.2 and 0.15
    });
  });

  describe('filterServices', () => {
    it('filters services by query and code', () => {
      const services: GrizzlyServiceItem[] = [
        { code: 'wa', name: 'WhatsApp' },
        { code: 'tg', name: 'Telegram' },
      ];

      expect(filterServices(services, { query: 'whats' }).length).toBe(1);
      expect(filterServices(services, { codes: ['tg'] }).length).toBe(1);
      expect(filterServices(services, { query: 'xyz' }).length).toBe(0);
    });
  });

  describe('filterCountries', () => {
    it('filters countries correctly', () => {
      const countries: GrizzlyCountryItem[] = [
        { id: 78, eng: 'France', rus: 'FranceRus', chn: 'Zh' },
        { id: 80, eng: 'Germany', rus: 'GermanyRus', chn: 'Zh' },
      ];

      expect(filterCountries(countries, { query: 'fran' }).length).toBe(1);
      expect(filterCountries(countries, { ids: [80] }).length).toBe(1);
    });
  });

  describe('sortBy', () => {
    it('sorts numeric fields correctly', () => {
      const items = [{ id: 3 }, { id: 1 }, { id: 2 }];
      expect(sortBy(items, 'id')[0].id).toBe(1);
      expect(sortBy(items, 'id', 'desc')[0].id).toBe(3);
    });

    it('sorts string fields correctly', () => {
      const items = [{ name: 'B' }, { name: 'A' }, { name: 'C' }];
      expect(sortBy(items, 'name')[0].name).toBe('A');
      expect(sortBy(items, 'name', 'desc')[0].name).toBe('C');
    });
  });
});
