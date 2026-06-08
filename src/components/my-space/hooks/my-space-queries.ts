import { queryOptions } from '@tanstack/react-query'
import { convexQuery, convexAction } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export const mySpaceQueries = {
  myActivations: () => queryOptions({
    ...convexQuery(api.activations.getMyActivations, {}),
    staleTime: 30 * 1000,
  }),

  balance: () => queryOptions({
    ...convexQuery(api.users.getUserBalance, {}),
    staleTime: 30 * 1000,
  }),

  activation: (id: Id<'activations'>) => queryOptions({
    ...convexQuery(api.activations.getActivation, { activationId: id }),
    staleTime: 15 * 1000,
  }),

  topCountries: (serviceId: string) => queryOptions({
    ...convexAction(api.admin.sync.getTopCountries, { service: serviceId }),
    staleTime: 60 * 1000,
  }),

  prices: (countryIso: string, serviceId: string) => queryOptions({
    ...convexAction(api.admin.sync.getPrices, { country: countryIso, service: serviceId }),
    staleTime: 30 * 1000,
  }),

  freePrices: (countryIso: string, serviceId: string) => queryOptions({
    ...convexAction(api.admin.sync.getFreePrices, { country: countryIso, service: serviceId }),
    staleTime: 30 * 1000,
  }),
}
