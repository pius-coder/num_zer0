/**
 * SMS Provider Package - Adapter Interface
 *
 * Defines the unified interface that all SMS provider adapters must implement.
 * This interface abstracts away provider-specific API differences.
 */

import type { Result } from "@/packages/result/result";
import type {
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
} from "./types";
import type { SmsProviderError } from "./errors";

/**
 * SMS Provider Adapter Interface
 *
 * All SMS provider adapters must implement this interface.
 * Methods return Result<T, SmsProviderError> for consistent error handling.
 */
export interface SmsProviderAdapter {
    /**
     * Provider type identifier (e.g., "tiger-sms", "sms-man")
     */
    readonly providerType: string;

    /**
     * Check account balance
     * @returns Balance information or error
     */
    getBalance(): Promise<Result<BalanceResponse, SmsProviderError>>;

    /**
     * Request a phone number for SMS verification
     * @param params - Parameters for the number request
     * @returns Activation details with phone number or error
     */
    getNumber(params: GetNumberParams): Promise<Result<NumberResponse, SmsProviderError>>;

    /**
     * Check SMS status / get verification code
     * @param activationId - The activation ID from getNumber
     * @returns Status information with code if received
     */
    getStatus(activationId: string): Promise<Result<StatusResponse, SmsProviderError>>;

    /**
     * Change activation status
     * @param activationId - The activation ID
     * @param action - Action to perform on the activation
     * @returns Result of the status change
     */
    setStatus(
        activationId: string,
        action: ActivationAction,
    ): Promise<Result<SetStatusResponse, SmsProviderError>>;

    /**
     * Get prices for services by country
     * @param countryId - Optional country ID to filter
     * @param serviceCode - Optional service code to filter
     * @returns Price matrix by country and service
     */
    getPrices(
        countryId?: string,
        serviceCode?: string,
    ): Promise<Result<PricesResponse, SmsProviderError>>;

    /**
     * Get list of available services
     * @returns Array of service items
     */
    getServices(): Promise<Result<ServiceItem[], SmsProviderError>>;

    /**
     * Get list of available countries
     * @returns Array of country items
     */
    getCountries(): Promise<Result<CountryItem[], SmsProviderError>>;

    /**
     * Get list of providers (Tiger SMS specific)
     * Some providers may not support this method.
     * @param countryId - Optional country ID to filter
     * @param serviceCode - Optional service code to filter
     * @returns Array of provider items
     */
    getProviders?(
        countryId?: string,
        serviceCode?: string,
    ): Promise<Result<ProviderItem[], SmsProviderError>>;
}

/**
 * Base configuration for adapter constructors
 */
export type AdapterConfig = {
    /** API key for authentication */
    apiKey: string;
    /** Base URL for the provider API */
    baseUrl: string;
    /** Request timeout in milliseconds */
    timeout?: number;
};
