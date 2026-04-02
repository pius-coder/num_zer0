import { BaseService } from '../base.service'
import type {
  GenerateLinkRequest,
  GenerateLinkResponse,
  DirectPayRequest,
  DirectPayResponse,
  Transaction,
  SearchParams,
  PayoutRequest,
  PayoutResponse,
  BalanceResponse,
} from './types'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.fapshi.com',
  live: 'https://live.fapshi.com',
}

export class FapshiClient extends BaseService {
  constructor(environment: 'sandbox' | 'live' = 'sandbox', apiUser?: string, apiKey?: string) {
    const user = apiUser ?? process.env.FAPSHI_API_USER
    const key = apiKey ?? process.env.FAPSHI_API_KEY

    super({
      prefix: 'fapshi',
      http: {
        baseUrl: BASE_URLS[environment] ?? BASE_URLS.sandbox,
        headers: {
          apiuser: user ?? '',
          apikey: key ?? '',
          'Content-Type': 'application/json',
        },
        timeoutMs: 30_000,
      },
      retry: { maxAttempts: 3 },
    })
  }

  async generateLink(params: GenerateLinkRequest): Promise<GenerateLinkResponse> {
    this.assert(params.amount >= 100, 'invalid_amount', 'Amount must be at least 100', {
      amount: params.amount,
    })

    return this.withRetry(
      () =>
        this.httpPost<GenerateLinkResponse>('/initiate-pay', {
          body: {
            amount: params.amount,
            email: params.email,
            redirectUrl: params.redirectUrl,
            userId: params.userId,
            externalId: params.externalId,
            message: params.message,
          },
        }),
      'fapshi_generate_link'
    )
  }

  async directPay(params: DirectPayRequest): Promise<DirectPayResponse> {
    this.assert(params.amount >= 100, 'invalid_amount', 'Amount must be at least 100', {
      amount: params.amount,
    })
    this.assert(
      /^(\+237)?[6][0-9]{8}$/.test(params.phone.replace(/[\s-]/g, '')),
      'invalid_phone',
      'Invalid Cameroonian phone number',
      { phone: params.phone }
    )

    return this.withRetry(
      () =>
        this.httpPost<DirectPayResponse>('/direct-pay', {
          body: {
            amount: params.amount,
            phone: params.phone,
            medium: params.medium,
            name: params.name,
            email: params.email,
            userId: params.userId,
            externalId: params.externalId,
            message: params.message,
          },
        }),
      'fapshi_direct_pay'
    )
  }

  async getStatus(transId: string): Promise<Transaction> {
    this.assert(!!transId && transId.length <= 100, 'invalid_trans_id', 'Invalid transaction ID', {
      transId,
    })

    return this.withRetry(
      () => this.httpGet<Transaction>(`/payment-status/${transId}`),
      'fapshi_get_status'
    )
  }

  async expire(transId: string): Promise<Transaction> {
    this.assert(!!transId && transId.length <= 100, 'invalid_trans_id', 'Invalid transaction ID', {
      transId,
    })

    return this.withRetry(
      () =>
        this.httpPost<Transaction>('/expire-pay', {
          body: { transId },
        }),
      'fapshi_expire'
    )
  }

  async getByUserId(userId: string): Promise<Transaction[]> {
    this.assert(
      /^[a-zA-Z0-9-_]{1,100}$/.test(userId),
      'invalid_user_id',
      'Invalid user ID format',
      { userId }
    )

    return this.withRetry(
      () => this.httpGet<Transaction[]>(`/transaction/${userId}`),
      'fapshi_get_by_user'
    )
  }

  async search(params?: SearchParams): Promise<Transaction[]> {
    const queryParams: Record<string, string> = {}

    if (params) {
      if (params.status) queryParams.status = params.status
      if (params.medium) queryParams.medium = params.medium
      if (params.start) queryParams.start = params.start
      if (params.end) queryParams.end = params.end
      if (params.amt !== undefined) queryParams.amt = String(params.amt)
      if (params.limit !== undefined) {
        this.assert(
          params.limit >= 1 && params.limit <= 100,
          'invalid_limit',
          'Limit must be between 1 and 100'
        )
        queryParams.limit = String(params.limit)
      }
      if (params.sort) queryParams.sort = params.sort
    }

    return this.withRetry(
      () => this.httpGet<Transaction[]>('/search', { params: queryParams }),
      'fapshi_search'
    )
  }

  async sendPayout(params: PayoutRequest): Promise<PayoutResponse> {
    this.assert(params.amount >= 100, 'invalid_amount', 'Amount must be at least 100', {
      amount: params.amount,
    })

    if (params.medium === 'fapshi') {
      this.assert(!!params.email, 'missing_email', 'Email required for fapshi payout')
    } else if (
      params.medium === 'mobile money' ||
      params.medium === 'orange money' ||
      !params.medium
    ) {
      this.assert(!!params.phone, 'missing_phone', 'Phone required for mobile money payout')
    }

    return this.withRetry(
      () =>
        this.httpPost<PayoutResponse>('/payout', {
          body: {
            amount: params.amount,
            phone: params.phone,
            medium: params.medium,
            name: params.name,
            email: params.email,
            userId: params.userId,
            externalId: params.externalId,
            message: params.message,
          },
        }),
      'fapshi_payout'
    )
  }

  async getBalance(): Promise<BalanceResponse> {
    return this.withRetry(() => this.httpGet<BalanceResponse>('/balance'), 'fapshi_balance')
  }
}
