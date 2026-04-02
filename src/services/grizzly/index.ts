import { GrizzlyClient } from './client'
import { env } from '@/config/env'

let _client: GrizzlyClient | null = null

export function getGrizzlyClient(): GrizzlyClient {
  if (!_client) {
    const apiKey = env.GRIZZLY_API_KEY
    _client = new GrizzlyClient(apiKey, 60_000)
  }
  return _client
}

export { GrizzlyClient }
export type {
  GrizzlyActivation,
  GrizzlyActivationStatusV2,
  GrizzlyCountryItem,
  GrizzlyGetNumberOptions,
  GrizzlyPriceRow,
  GrizzlyServiceItem,
  GrizzlySetStatusCode,
  GrizzlySetStatusResponse,
} from './types'
