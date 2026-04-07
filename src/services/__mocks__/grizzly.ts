import { mockCountries, mockServices, mockPricesV3Raw } from './fixtures';
import type { 
  GrizzlyCountryItem, 
  GrizzlyServiceItem, 
  PricesV3Raw, 
  PriceV3Entry,
  FlatPriceV3Row,
  GrizzlyActivation,
  GrizzlySetStatusResponse,
} from '../grizzly/types';
import { flattenPricesV3 } from '../grizzly/utils';

export const mockGrizzlyClient = () => {
  return {
    getCountries: async (): Promise<GrizzlyCountryItem[]> => {
      return mockCountries();
    },

    getServicesList: async (): Promise<GrizzlyServiceItem[]> => {
      return mockServices();
    },

    getPricesV3All: async (): Promise<PricesV3Raw> => {
      return mockPricesV3Raw();
    },

    getPricesV3: async (country: string, service: string): Promise<PriceV3Entry | null> => {
      const raw = mockPricesV3Raw();
      if (raw[country] && raw[country][service]) {
        return raw[country][service];
      }
      return null;
    },

    searchPricesV3: async (filters: any): Promise<{ data: FlatPriceV3Row[], total: number }> => {
      const flat = flattenPricesV3(mockPricesV3Raw());
      // Simple mock filter for tests
      let data = flat;
      if (filters.country) data = data.filter(d => d.country === filters.country);
      if (filters.service) data = data.filter(d => d.service === filters.service);
      return { data, total: data.length };
    },

    getBalance: async (): Promise<number> => {
      return 1000.50;
    },

    getNumber: async (options: any): Promise<GrizzlyActivation> => {
      return {
        activationId: 999999,
        phoneNumber: '79001234567',
        activationCost: 50.0,
        currency: 643,
        countryCode: options.country || '0',
        canGetAnotherSms: false,
        activationTime: new Date().toISOString()
      };
    },

    setActivationStatus: async (activationId: number, status: number): Promise<GrizzlySetStatusResponse> => {
      return {
        status: status === -8 ? 'ACCESS_CANCEL' : 'ACCESS_READY',
        raw: 'mock_response'
      };
    }
  };
};
