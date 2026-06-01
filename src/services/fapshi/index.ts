import { FapshiClient } from './client'

let client: FapshiClient | null = null

export function getFapshiClient(): FapshiClient {
  if (!client) {
    const env = (process.env.FAPSHI_ENVIRONMENT as 'sandbox' | 'live') ?? 'sandbox'
    client = new FapshiClient(env)
  }
  return client
}

export function createFapshiClient(environment: 'sandbox' | 'live' = 'sandbox'): FapshiClient {
  return new FapshiClient(environment)
}
