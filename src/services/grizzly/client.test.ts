import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { GrizzlyClient } from './client'
import { FIXTURE_COUNTRY_FRANCE, mockPricesV3Raw, FIXTURE_SERVICE_WHATSAPP } from '../__mocks__'

describe('GrizzlyClient', () => {
  let client: GrizzlyClient

  beforeEach(() => {
    client = new GrizzlyClient('dummy-api-key', 500) // 500ms TTL
    client.log = {
      info: mock(),
      warn: mock(),
      error: mock(),
      debug: mock(),
    } as any
  })

  it('getCountries parses and caches correctly', async () => {
    // Mock httpGet
    (client as any).httpGet = mock().mockResolvedValue([FIXTURE_COUNTRY_FRANCE])

    const result1 = await client.getCountries()
    expect(result1[0]).toEqual(FIXTURE_COUNTRY_FRANCE)

    const result2 = await client.getCountries()
    expect(result2[0]).toEqual(FIXTURE_COUNTRY_FRANCE)

    // Should only be called once due to cache
    expect((client as any).httpGet).toHaveBeenCalledTimes(1)
  })

  it('getPricesV3 returns price for specific country+service', async () => {
    (client as any).httpGet = mock().mockResolvedValue(mockPricesV3Raw())

    const result = await client.getPricesV3('78', 'wa')
    expect(result).not.toBeNull()
    expect(result?.price).toBe(0.15)
  })

  it('getServicesList parses correctly', async () => {
    (client as any).httpGet = mock().mockResolvedValue({ services: [FIXTURE_SERVICE_WHATSAPP] })

    const result = await client.getServicesList()
    expect(result[0].code).toBe('wa')
  })

  it('clearCache resets the TTLCache', async () => {
    (client as any).httpGet = mock().mockResolvedValue([FIXTURE_COUNTRY_FRANCE])
    await client.getCountries()
    
    client.clearCache()
    await client.getCountries()

    // Called twice because cache was cleared
    expect((client as any).httpGet).toHaveBeenCalledTimes(2)
  })
})
