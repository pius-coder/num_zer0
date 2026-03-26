/**
 * SMS-Man Adapter
 *
 * Implements the SmsProviderAdapter interface for SMS-Man API.
 * SMS-Man uses JSON responses with separate endpoint paths.
 *
 * API Documentation: https://sms-man.com/api
 *
 * Endpoints:
 *   GET /control/get-balance?token=...
 *   GET /control/applications?token=...
 *   GET /control/countries?token=...
 *   GET /control/get-prices?token=...
 *   GET /control/get-number?token=...&country_id=...&application_id=...
 *   GET /control/get-sms?token=...&request_id=...
 *   GET /control/set-status?token=...&request_id=...&status=...
 */

import axios, { AxiosInstance } from "axios";
import { Result, Ok, Err } from "@/packages/result/result";
import { SmsProviderError, createNetworkError } from "../errors";
import { SmsProviderAdapter, AdapterConfig } from "../adapter";
import {
    BalanceResponse,
    NumberResponse,
    StatusResponse,
    SetStatusResponse,
    GetNumberParams,
    PricesResponse,
    ServiceItem,
    CountryItem,
    ProviderItem,
    ActivationAction,
} from "../types";
import {
    parseBalance,
    parseNumber,
    parseStatus,
    parseSetStatus,
    parseServices,
    parseCountries,
    parsePrices,
} from "../parsers/sms-man.parser";

/**
 * Maps our ActivationAction to SMS-Man status strings
 */
function mapActionToStatus(action: ActivationAction): string {
    switch (action) {
        case "cancel":
            return "reject";
        case "complete":
            return "close";
        case "ready":
            return "ready";
        case "retry":
            return "ready";
        default:
            return "reject";
    }
}

/**
 * SMS-Man Adapter implementation
 */
export class SmsManAdapter implements SmsProviderAdapter {
    readonly providerType = "sms-man" as const;
    private client: AxiosInstance;
    private apiKey: string;

    constructor(config: AdapterConfig) {
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: config.baseUrl || "https://api.sms-man.com/control",
            timeout: config.timeout || 30000,
        });
    }

    /**
     * Makes an API request to SMS-Man
     */
    private async request<T>(
        endpoint: string,
        params: Record<string, string | number> = {}
    ): Promise<Result<T, SmsProviderError>> {
        try {
            const response = await this.client.get(endpoint, {
                params: {
                    token: this.apiKey,
                    ...params,
                },
            });

            // Check for API error response
            const data = response.data;
            if (data && data.success === false) {
                const errorCode = data.error_code || "unknown";
                const errorMsg = data.error_msg || "Unknown error";
                return Err(
                    new SmsProviderError(
                        errorCode,
                        typeof errorMsg === "object" ? JSON.stringify(errorMsg) : String(errorMsg),
                        this.providerType
                    )
                );
            }

            return Ok(data as T);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return Err(createNetworkError("sms-man", error));
            }
            throw error;
        }
    }

    /**
     * Gets the current account balance
     */
    async getBalance(): Promise<Result<BalanceResponse, SmsProviderError>> {
        const result = await this.request<{ balance?: string; hold?: number }>(
            "/get-balance"
        );

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseBalance(result.data);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets a phone number for verification
     */
    async getNumber(params: GetNumberParams): Promise<Result<NumberResponse, SmsProviderError>> {
        const result = await this.request<{
            request_id?: string | number;
            country_id?: string | number;
            application_id?: string | number;
            number?: string;
            error_code?: string;
            error_msg?: string;
        }>("/get-number", {
            country_id: params.countryId,
            application_id: params.serviceCode,
        });

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseNumber(result.data);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets the status of an activation / waits for SMS
     */
    async getStatus(activationId: string): Promise<Result<StatusResponse, SmsProviderError>> {
        const result = await this.request<{
            request_id?: string | number;
            sms_code?: string;
            full_sms?: string;
            error_code?: string;
            error_msg?: string;
        }>("/get-sms", {
            request_id: activationId,
        });

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseStatus(result.data, activationId);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Sets the status of an activation
     */
    async setStatus(
        activationId: string,
        action: ActivationAction
    ): Promise<Result<SetStatusResponse, SmsProviderError>> {
        const result = await this.request<{
            request_id?: string | number;
            success?: boolean;
            error_code?: string;
            error_msg?: string;
        }>("/set-status", {
            request_id: activationId,
            status: mapActionToStatus(action),
        });

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseSetStatus(result.data, activationId);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets prices for services and countries
     */
    async getPrices(countryId?: string): Promise<Result<PricesResponse, SmsProviderError>> {
        const params: Record<string, string> = {};
        if (countryId) {
            params.country_id = countryId;
        }

        const result = await this.request<Record<string, Record<string, { cost: string; count: number }>>>(
            "/get-prices",
            params
        );

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parsePrices(result.data);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets available services/applications
     */
    async getServices(): Promise<Result<ServiceItem[], SmsProviderError>> {
        const result = await this.request<Record<string, { id: string; name: string; code: string }>>(
            "/applications"
        );

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseServices(result.data);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets available countries
     */
    async getCountries(): Promise<Result<CountryItem[], SmsProviderError>> {
        const result = await this.request<Record<string, { id: string; title: string; code?: string }>>(
            "/countries"
        );

        if (!result.ok) {
            return Err(result.error);
        }

        try {
            const data = parseCountries(result.data);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            throw error;
        }
    }

    /**
     * Gets available providers (not supported by SMS-Man)
     */
    async getProviders(): Promise<Result<ProviderItem[], SmsProviderError>> {
        return Ok([]);
    }
}

/**
 * Factory function to create SMS-Man adapter
 */
export function createSmsManAdapter(config: AdapterConfig): SmsProviderAdapter {
    return new SmsManAdapter(config);
}
