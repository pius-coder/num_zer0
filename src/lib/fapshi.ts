import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'fapshi-sdk' })

/**
 * Fapshi Configuration
 */
export interface FapshiConfig {
    apiKey: string
    apiUser: string
    baseUrl?: string
}

/**
 * Parameters for initiating a payment
 */
export interface InitiatePayParams {
    amount: number
    userId: string
    externalId: string
    email?: string
    redirectUrl?: string
    message?: string
}

/**
 * Response from Initiate Pay endpoint
 */
export interface InitiatePayResponse {
    message: string
    link: string
    transId: string
}

/**
 * Transaction status values
 */
export type FapshiTransactionStatus = 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'

/**
 * Detailed payment status response
 */
export interface FapshiPaymentStatus {
    transId: string
    status: FapshiTransactionStatus
    amount: number
    userId: string
    externalId: string
    medium: string
    serviceName: string
    revenue: number
    payerName: string | null
    email: string | null
    redirectUrl: string
    webhook: string | null
    financialTransId: string | null
    dateInitiated: string
    dateConfirmed: string | null
}

/**
 * Lightweight Fapshi SDK for payment initialization
 */
export class FapshiClient {
    private config: FapshiConfig

    constructor(config: FapshiConfig) {
        this.config = {
            baseUrl: 'https://api.fapshi.com',
            ...config,
        }
    }

    /**
     * Generic request helper
     */
    private async request<T>(endpoint: string, options: RequestInit, retryCount = 0): Promise<T> {
        const { default: axios } = await import('axios')
        const url = `${this.config.baseUrl}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            apiuser: this.config.apiUser,
            apikey: this.config.apiKey,
        }

        try {
            log.info('fapshi_request_start', { url, method: options.method, retry: retryCount })

            const response = await axios({
                url,
                method: options.method as any,
                headers,
                data: options.body ? JSON.parse(options.body as string) : undefined,
                timeout: 30000, // Increase to 30s for stability
            })

            return response.data as T
        } catch (error: any) {
            // RETRY LOGIC: Only for GET requests on timeout or 5xx
            const isGet = options.method === 'GET'
            const isTimeout = error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.code === 'ECONNABORTED'
            const is5xx = error.response?.status >= 500

            // User asked for "many retries until time ends". We'll do 10 retries (~20-30s total)
            if (isGet && (isTimeout || is5xx) && retryCount < 10) {
                log.warn('fapshi_request_retrying', {
                    endpoint,
                    error: error.message,
                    code: error.code,
                    retry: retryCount + 1
                })
                // Wait 2s before retry
                await new Promise(resolve => setTimeout(resolve, 2000))
                return this.request<T>(endpoint, options, retryCount + 1)
            }

            if (error.response) {
                log.error('fapshi_api_error', {
                    endpoint,
                    status: error.response.status,
                    error: error.response.data?.message || error.message,
                    data: error.response.data,
                })
                throw new Error(error.response.data?.message || `Fapshi API error: ${error.response.status}`)
            } else if (error.request) {
                log.error('fapshi_request_failed_no_response', {
                    endpoint,
                    error: error.message,
                    code: error.code,
                })
                throw new Error(`Fapshi request failed: ${error.message}${error.code ? ` (${error.code})` : ''}`)
            } else {
                log.error('fapshi_setup_error', {
                    endpoint,
                    error: error.message,
                })
                throw error
            }
        }
    }

    /**
     * Generates a payment link to redirect users to Fapshi-hosted checkout
     */
    async initiatePay(params: InitiatePayParams): Promise<InitiatePayResponse> {
        if (params.amount < 100) {
            throw new Error('Fapshi minimum amount is 100 XAF')
        }

        return this.request<InitiatePayResponse>('/initiate-pay', {
            method: 'POST',
            body: JSON.stringify(params),
        })
    }

    /**
     * Retrieves the status of a payment transaction
     */
    async paymentStatus(transId: string): Promise<FapshiPaymentStatus> {
        return this.request<FapshiPaymentStatus>(`/payment-status/${transId}`, {
            method: 'GET',
        })
    }
}

/**
 * Factory to create a FapshiClient instance from environment variables
 */
export function createFapshiClientFromEnv(): FapshiClient {
    const apiKey = process.env.FAPSHI_API_KEY
    const apiUser = process.env.FAPSHI_API_USER
    const environment = process.env.FAPSHI_ENVIRONMENT || 'sandbox'

    if (!apiKey || !apiUser) {
        throw new Error('Missing FAPSHI_API_KEY or FAPSHI_API_USER environment variables')
    }

    log.info('creating_fapshi_client', {
        environment,
        userPrefix: apiUser?.slice(0, 4),
        keyPrefix: apiKey?.slice(0, 4),
        hasApiKey: !!apiKey,
        hasApiUser: !!apiUser
    })

    const baseUrl =
        environment.toLowerCase() === 'production'
            ? 'https://api.fapshi.com'
            : 'https://sandbox.fapshi.com'

    return new FapshiClient({ apiKey, apiUser, baseUrl })
}
