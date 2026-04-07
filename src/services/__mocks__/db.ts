import { FIXTURE_OVERRIDE_WHATSAPP_FRANCE, FIXTURE_OVERRIDE_TELEGRAM_USA, FIXTURE_OVERRIDE_GMAIL_INDIA } from './fixtures';

export class MockDb {
  data: Record<string, any[]> = {
    price_override: [],
    external_service_mapping: [],
    external_country_mapping: []
  };

  select(from: string, filterFn: (item: any) => boolean = () => true) {
    return (this.data[from] || []).filter(filterFn);
  }

  insert(into: string, items: any[]) {
    if (!this.data[into]) this.data[into] = [];
    this.data[into].push(...items);
    return items;
  }

  update(table: string, items: any[], filterFn: (item: any) => boolean) {
    if (!this.data[table]) return [];
    const index = this.data[table].findIndex(filterFn);
    if (index >= 0) {
      this.data[table][index] = { ...this.data[table][index], ...items[0] };
      return [this.data[table][index]];
    }
    return [];
  }

  delete(table: string, filterFn: (item: any) => boolean) {
    if (!this.data[table]) return [];
    const initialLength = this.data[table].length;
    this.data[table] = this.data[table].filter(item => !filterFn(item));
    return initialLength !== this.data[table].length;
  }

  seedOverrides() {
    this.data.price_override = [
      FIXTURE_OVERRIDE_WHATSAPP_FRANCE,
      FIXTURE_OVERRIDE_TELEGRAM_USA,
      FIXTURE_OVERRIDE_GMAIL_INDIA
    ];
  }

  seedMappings() {
    this.data.external_service_mapping = [
      { id: '1', providerId: 'grizzly', externalId: 'wa', internalSlug: 'whatsapp' },
      { id: '2', providerId: 'grizzly', externalId: 'tg', internalSlug: 'telegram' },
      { id: '3', providerId: 'grizzly', externalId: 'go', internalSlug: 'google' }
    ];
    this.data.external_country_mapping = [
      { id: '1', providerId: 'grizzly', externalId: '78', internalIso: '78' },
      { id: '2', providerId: 'grizzly', externalId: '187', internalIso: '187' },
      { id: '3', providerId: 'grizzly', externalId: '22', internalIso: '22' }
    ];
  }
}

export const mockDb = () => new MockDb();
