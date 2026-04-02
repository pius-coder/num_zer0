import type { BaseService } from '../base.service'
import type {
  GrizzlyActivation,
  GrizzlyActivationStatusV2,
  GrizzlyGetNumberOptions,
  GrizzlySetStatusCode,
  GrizzlySetStatusResponse,
} from './types'

const GRIZZLY_ERRORS = [
  'BAD_KEY',
  'NO_NUMBERS',
  'NO_BALANCE',
  'NO_ACTIVATION',
  'BAD_SERVICE',
  'BAD_STATUS',
  'BAD_ACTION',
  'ERROR_SQL',
  'SERVICE_UNAVAILABLE_REGION',
] as const

function checkTextError(base: BaseService, text: string): void {
  if (text.includes('NO_BALANCE')) {
    throw base.error('grizzly_no_balance', 'GrizzlySMS account balance is empty', {
      response: text.slice(0, 500),
    })
  }

  for (const code of GRIZZLY_ERRORS) {
    if (code === 'NO_BALANCE') continue
    if (text.includes(code)) {
      throw base.error('grizzly_api_error', `GrizzlySMS error: ${code}`, {
        code,
        response: text.slice(0, 500),
      })
    }
  }
}

function buildParams(
  apiKey: string,
  action: string,
  extra?: Record<string, string | number | undefined>
): Record<string, string> {
  const params: Record<string, string> = { api_key: apiKey, action }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') params[k] = String(v)
    }
  }
  return params
}

export async function getNumberV2(
  base: BaseService,
  apiKey: string,
  options: GrizzlyGetNumberOptions
): Promise<GrizzlyActivation> {
  return base.withRetry(async () => {
    // getNumberV2 returns JSON, but check for plain-text errors first
    const rawText = await base.httpGetText('', {
      params: buildParams(apiKey, 'getNumberV2', {
        service: options.service,
        country: options.country,
        maxPrice: options.maxPrice,
        providerIds: options.providerIds?.join(','),
        exceptProviderIds: options.exceptProviderIds?.join(','),
      }),
    })
    checkTextError(base, rawText)

    // Parse as JSON only if no text errors
    const raw = JSON.parse(rawText) as Record<string, unknown>
    return {
      activationId: Number(raw.activationId),
      phoneNumber: String(raw.phoneNumber),
      activationCost: Number(raw.activationCost),
      currency: Number(raw.currency),
      countryCode: String(raw.countryCode),
      canGetAnotherSms: raw.canGetAnotherSms === '1' || raw.canGetAnotherSms === true,
      activationTime: String(raw.activationTime),
    }
  }, 'getNumberV2')
}

export async function setStatus(
  base: BaseService,
  apiKey: string,
  activationId: number,
  status: GrizzlySetStatusCode
): Promise<GrizzlySetStatusResponse> {
  return base.withRetry(async () => {
    const raw = await base.httpGetText('', {
      params: buildParams(apiKey, 'setStatus', { id: activationId, status }),
    })
    checkTextError(base, raw)
    const map: Record<string, GrizzlySetStatusResponse['status']> = {
      ACCESS_READY: 'ACCESS_READY',
      ACCESS_RETRY_GET: 'ACCESS_RETRY_GET',
      ACCESS_ACTIVATION: 'ACCESS_ACTIVATION',
      ACCESS_CANCEL: 'ACCESS_CANCEL',
    }
    const trimmed = raw.trim()
    base.assert(!!map[trimmed], 'grizzly_unexpected_status', 'Unexpected setStatus response', {
      raw: trimmed,
    })
    return { status: map[trimmed], raw: trimmed }
  }, 'setStatus')
}

export async function getStatusV2(
  base: BaseService,
  apiKey: string,
  activationId: number
): Promise<GrizzlyActivationStatusV2> {
  return base.withRetry(async () => {
    const rawText = await base.httpGetText('', {
      params: buildParams(apiKey, 'getStatusV2', { id: activationId }),
    })
    checkTextError(base, rawText)
    return JSON.parse(rawText) as GrizzlyActivationStatusV2
  }, 'getStatusV2')
}

export async function getBalance(base: BaseService, apiKey: string): Promise<number> {
  return base.withRetry(async () => {
    const raw = await base.httpGetText('', { params: buildParams(apiKey, 'getBalance') })
    checkTextError(base, raw)
    const [prefix, balanceStr] = raw.split(':')
    base.assert(
      prefix === 'ACCESS_BALANCE' && balanceStr,
      'grizzly_unexpected_balance',
      'Unexpected balance response',
      {
        raw: raw.slice(0, 200),
      }
    )
    return Number.parseFloat(balanceStr)
  }, 'getBalance')
}
