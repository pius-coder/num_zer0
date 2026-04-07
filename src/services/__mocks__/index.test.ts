import { describe, it, expect } from 'bun:test';
import { mockGrizzlyClient, mockDb, FIXTURE_COUNTRY_FRANCE, FIXTURE_OVERRIDE_WHATSAPP_FRANCE } from './index';

describe('Shared Mock Factories', () => {
  describe('mockGrizzlyClient', () => {
    it('returns typed mock data for getCountries', async () => {
      const client = mockGrizzlyClient();
      const countries = await client.getCountries();
      expect(countries.length).toBeGreaterThan(0);
      expect(countries[0]).toEqual(FIXTURE_COUNTRY_FRANCE);
    });

    it('returns typed mock data for getPricesV3', async () => {
      const client = mockGrizzlyClient();
      const price = await client.getPricesV3('78', 'wa');
      expect(price).not.toBeNull();
      expect(price?.price).toBe(0.15);
    });
  });

  describe('mockDb', () => {
    it('supports insert and select', () => {
      const db = mockDb();
      db.insert('price_override', [FIXTURE_OVERRIDE_WHATSAPP_FRANCE]);
      const result = db.select('price_override');
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(FIXTURE_OVERRIDE_WHATSAPP_FRANCE);
    });

    it('seeds overrides correctly', () => {
      const db = mockDb();
      db.seedOverrides();
      const result = db.select('price_override');
      expect(result.length).toBe(3);
    });

    it('supports delete and update', () => {
      const db = mockDb();
      db.seedOverrides();
      db.update('price_override', [{ priceCredits: 999 }], item => item.id === 'test_1');
      const result = db.select('price_override', item => item.id === 'test_1');
      expect(result[0].priceCredits).toBe(999);

      db.delete('price_override', item => item.id === 'test_2');
      const all = db.select('price_override');
      expect(all.length).toBe(2);
    });
  });
});
