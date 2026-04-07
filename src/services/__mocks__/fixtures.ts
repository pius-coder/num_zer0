import type { GrizzlyCountryItem, GrizzlyServiceItem, PricesV3Raw } from '../grizzly/types';

export const FIXTURE_COUNTRY_FRANCE: GrizzlyCountryItem = { id: 78, eng: 'France', rus: 'Франция', chn: '法国' };
export const FIXTURE_COUNTRY_USA: GrizzlyCountryItem = { id: 187, eng: 'USA', rus: 'США', chn: '美国' };
export const FIXTURE_COUNTRY_RUSSIA: GrizzlyCountryItem = { id: 0, eng: 'Russia', rus: 'Россия', chn: '俄罗斯' };
export const FIXTURE_COUNTRY_UKRAINE: GrizzlyCountryItem = { id: 1, eng: 'Ukraine', rus: 'Украина', chn: '乌克兰' };
export const FIXTURE_COUNTRY_INDIA: GrizzlyCountryItem = { id: 22, eng: 'India', rus: 'Индия', chn: '印度' };

export const mockCountries = (): GrizzlyCountryItem[] => [
  FIXTURE_COUNTRY_FRANCE,
  FIXTURE_COUNTRY_USA,
  FIXTURE_COUNTRY_RUSSIA,
  FIXTURE_COUNTRY_UKRAINE,
  FIXTURE_COUNTRY_INDIA,
];

export const FIXTURE_SERVICE_WHATSAPP: GrizzlyServiceItem = { code: 'wa', name: 'WhatsApp' };
export const FIXTURE_SERVICE_TELEGRAM: GrizzlyServiceItem = { code: 'tg', name: 'Telegram' };
export const FIXTURE_SERVICE_VIBER: GrizzlyServiceItem = { code: 'vi', name: 'Viber' };
export const FIXTURE_SERVICE_GMAIL: GrizzlyServiceItem = { code: 'go', name: 'Google,youtube,Gmail' };
export const FIXTURE_SERVICE_TIKTOK: GrizzlyServiceItem = { code: 'lf', name: 'TikTok/Douyin' };

export const mockServices = (): GrizzlyServiceItem[] => [
  FIXTURE_SERVICE_WHATSAPP,
  FIXTURE_SERVICE_TELEGRAM,
  FIXTURE_SERVICE_VIBER,
  FIXTURE_SERVICE_GMAIL,
  FIXTURE_SERVICE_TIKTOK,
];

export const mockPricesV3Raw = (): PricesV3Raw => ({
  '78': {
    'wa': {
      price: 0.15,
      count: 1000,
      providers: {
        '1': { count: 500, price: [0.15], provider_id: 1 },
        '2': { count: 500, price: [0.2], provider_id: 2 }
      }
    },
    'tg': {
      price: 0.25,
      count: 200,
      providers: {
        '1': { count: 200, price: [0.25], provider_id: 1 }
      }
    }
  },
  '187': {
    'wa': {
      price: 0.5,
      count: 50,
      providers: {
        '3': { count: 50, price: [0.5], provider_id: 3 }
      }
    }
  },
  '0': {
    'tg': {
      price: 0.05,
      count: 5000,
      providers: null
    }
  }
});

export const FIXTURE_OVERRIDE_WHATSAPP_FRANCE = { id: 'test_1', serviceSlug: 'whatsapp', countryIso: '78', priceCredits: 500 };
export const FIXTURE_OVERRIDE_TELEGRAM_USA = { id: 'test_2', serviceSlug: 'telegram', countryIso: '187', priceCredits: 1000 };
export const FIXTURE_OVERRIDE_GMAIL_INDIA = { id: 'test_3', serviceSlug: 'google', countryIso: '22', priceCredits: 200 };
