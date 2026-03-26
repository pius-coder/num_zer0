/**
 * Tiger SMS Adapter
 *
 * Implements the SmsProviderAdapter interface for Tiger SMS API.
 * Tiger SMS uses plain-text responses and query parameters.
 *
 * API Documentation: https://tiger-sms.com/api
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
    TIGER_SMS_STATUS_CODES,
} from "../types";
import {
    parseBalance,
    parseNumber,
    parseStatus,
    parseSetStatus,
    parsePrices,
    parseProviders,
} from "../parsers/tiger-sms.parser";

// Import hardcoded data
import servicesData from "./data/tiger-sms-services.json";
import countriesData from "./data/tiger-sms-countries.json";

/**
 * Tiger SMS API actions
 */
const ACTIONS = {
    GET_BALANCE: "getBalance",
    GET_NUMBER: "getNumber",
    GET_STATUS: "getStatus",
    SET_STATUS: "setStatus",
    GET_PRICES: "getPrices",
    GET_PROVIDERS: "getProviders",
} as const;

/**
 * Tiger SMS Adapter implementation
 */
export class TigerSmsAdapter implements SmsProviderAdapter {
    readonly providerType = "tiger-sms";
    private client: AxiosInstance;
    private apiKey: string;

    constructor(config: AdapterConfig) {
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout ?? 10000,
            method: "GET",
        });
    }

    /**
     * Makes an API request to Tiger SMS
     */
    private async request(params: Record<string, string | number>): Promise<string> {
        try {
            const response = await this.client.request({
                params: {
                    api_key: this.apiKey,
                    ...params,
                },
            });
            // Handle both plain text and JSON responses
            const data = response.data;
            if (typeof data === "string") {
                return data;
            }
            return JSON.stringify(data);
        } catch (error) {
            throw createNetworkError(this.providerType, error);
        }
    }

    /**
     * Check account balance
     */
    async getBalance(): Promise<Result<BalanceResponse, SmsProviderError>> {
        try {
            const response = await this.request({ action: ACTIONS.GET_BALANCE });
            const data = parseBalance(response);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }

    /**
     * Request a phone number for SMS verification
     */
    async getNumber(params: GetNumberParams): Promise<Result<NumberResponse, SmsProviderError>> {
        try {
            const requestParams: Record<string, string | number> = {
                action: ACTIONS.GET_NUMBER,
                service: params.serviceCode,
                country: params.countryId,
            };

            // Optional parameters
            if (params.maxPrice !== undefined) {
                requestParams.max_price = params.maxPrice;
            }
            if (params.providerIds?.length) {
                requestParams.provider = params.providerIds.join(",");
            }
            if (params.exceptProviderIds?.length) {
                requestParams.except_provider = params.exceptProviderIds.join(",");
            }
            if (params.ref) {
                requestParams.ref = params.ref;
            }

            const response = await this.request(requestParams);
            const data = parseNumber(response);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }

    /**
     * Check SMS status / get verification code
     */
    async getStatus(activationId: string): Promise<Result<StatusResponse, SmsProviderError>> {
        try {
            const response = await this.request({
                action: ACTIONS.GET_STATUS,
                id: activationId,
            });
            const data = parseStatus(response, activationId);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }

    /**
     * Change activation status
     */
    async setStatus(
        activationId: string,
        action: ActivationAction,
    ): Promise<Result<SetStatusResponse, SmsProviderError>> {
        try {
            const statusCode = TIGER_SMS_STATUS_CODES[action];
            if (statusCode === undefined) {
                return Err(
                    new SmsProviderError("BAD_ACTION", `Invalid action: ${action}`, this.providerType),
                );
            }

            const response = await this.request({
                action: ACTIONS.SET_STATUS,
                id: activationId,
                status: statusCode,
            });
            const data = parseSetStatus(response, activationId);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }

    /**
     * Get prices for services by country
     */
    async getPrices(
        countryId?: string,
        serviceCode?: string,
    ): Promise<Result<PricesResponse, SmsProviderError>> {
        try {
            const requestParams: Record<string, string> = {
                action: ACTIONS.GET_PRICES,
            };

            if (countryId) {
                requestParams.country = countryId;
            }
            if (serviceCode) {
                requestParams.service = serviceCode;
            }

            const response = await this.request(requestParams);
            const data = parsePrices(response);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }

    /**
     * Get list of available services
     * Note: Tiger SMS does not have an API endpoint for this.
     * Returns hardcoded data from documentation.
     */
    async getServices(): Promise<Result<ServiceItem[], SmsProviderError>> {
        // Return hardcoded services data
        return Ok(servicesData as ServiceItem[]);
    }

    /**
     * Get list of available countries
     * Note: Tiger SMS does not have an API endpoint for this.
     * Returns hardcoded data from documentation.
     */
    async getCountries(): Promise<Result<CountryItem[], SmsProviderError>> {
        // Return hardcoded countries data
        return Ok(countriesData as CountryItem[]);
    }

    /**
     * Get list of providers (Tiger SMS specific)
     */
    async getProviders(
        countryId?: string,
        serviceCode?: string,
    ): Promise<Result<ProviderItem[], SmsProviderError>> {
        try {
            const requestParams: Record<string, string> = {
                action: ACTIONS.GET_PROVIDERS,
            };

            if (countryId) {
                requestParams.country = countryId;
            }
            if (serviceCode) {
                requestParams.service = serviceCode;
            }

            const response = await this.request(requestParams);
            const data = parseProviders(response);
            return Ok(data);
        } catch (error) {
            if (error instanceof SmsProviderError) {
                return Err(error);
            }
            return Err(createNetworkError(this.providerType, error));
        }
    }
}

/**
 * Factory function to create Tiger SMS adapter
 */
export function createTigerSmsAdapter(config: AdapterConfig): SmsProviderAdapter {
    return new TigerSmsAdapter(config);
}
