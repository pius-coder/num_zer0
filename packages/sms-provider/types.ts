/**
 * SMS Provider Package - Type Definitions
 *
 * This file contains all shared types for the SMS provider adapter package.
 * These types are normalized across different SMS provider APIs (Tiger SMS, SMS-Man, etc.)
 */

// ─── Provider Configuration ───

/**
 * Supported SMS provider types
 */
export type ProviderType = "tiger-sms" | "sms-man";

/**
 * Configuration for creating an SMS provider adapter
 */
export type SmsProviderConfig = {
    /** Provider type identifier */
    type: ProviderType;
    /** API key for authentication */
    apiKey: string;
    /** Base URL for the provider API */
    baseUrl: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
};

// ─── Unified Response Types ───
// All adapters normalize their responses to these types

/**
 * Balance response from provider
 */
export type BalanceResponse = {
    /** Account balance */
    balance: number;
    /** Currency code (e.g., "RUB", "USD") */
    currency?: string;
};

/**
 * Phone number response after requesting activation
 */
export type NumberResponse = {
    /** Activation/transaction ID from provider */
    activationId: string;
    /** Phone number in international format */
    phoneNumber: string;
    /** External country ID from provider */
    countryId?: string;
    /** External service ID/code from provider */
    serviceId?: string;
};

/**
 * SMS status values
 */
export type SmsStatus =
    | "waiting" // Waiting for SMS
    | "received" // Code received
    | "cancelled" // Activation cancelled
    | "retry" // Waiting for next SMS
    | "expired"; // Activation expired

/**
 * Status response when checking for SMS code
 */
export type StatusResponse = {
    /** Activation/transaction ID */
    activationId: string;
    /** Current status of the activation */
    status: SmsStatus;
    /** The SMS verification code (when status is "received") */
    code?: string;
    /** Full SMS text if available */
    fullSms?: string;
};

/**
 * Actions that can be performed on an activation
 */
export type ActivationAction =
    | "ready" // SMS has been sent to the number
    | "retry" // Request another SMS
    | "complete" // Confirm and complete activation
    | "cancel"; // Cancel activation

/**
 * Response after setting activation status
 */
export type SetStatusResponse = {
    /** Activation/transaction ID */
    activationId: string;
    /** Whether the action was successful */
    success: boolean;
    /** New status after action */
    newStatus?: string;
};

/**
 * Parameters for requesting a phone number
 */
export type GetNumberParams = {
    /** External service code (e.g., "wa" for WhatsApp) */
    serviceCode: string;
    /** External country ID */
    countryId: string;
    /** Maximum price willing to pay (in provider currency) */
    maxPrice?: number;
    /** Type of activation */
    activationType?: "SMS" | "CALL_FLASH" | "CALL_VOICE";
    /** Specific provider IDs to use (Tiger SMS only) */
    providerIds?: string[];
    /** Provider IDs to exclude (Tiger SMS only) */
    exceptProviderIds?: string[];
    /** Reference/affiliate ID */
    ref?: string;
};

/**
 * Price entry for a service in a country
 */
export type PriceEntry = {
    /** Cost in provider currency */
    cost: number;
    /** Number of available phone numbers */
    count: number;
};

/**
 * Prices response - nested by country and service
 * Format: { [countryId]: { [serviceCode]: PriceEntry } }
 */
export type PricesResponse = Record<string, Record<string, PriceEntry>>;

/**
 * Service item from provider
 */
export type ServiceItem = {
    /** External service ID or code */
    id: string;
    /** Human-readable service name */
    name: string;
    /** Short code (e.g., "wa", "tg", "fb") */
    code: string;
};

/**
 * Country item from provider
 */
export type CountryItem = {
    /** External country ID */
    id: string;
    /** Human-readable country name */
    name: string;
    /** ISO 3166-1 alpha-2 code (e.g., "US", "NG") */
    isoCode?: string;
};

/**
 * Provider item (Tiger SMS specific)
 */
export type ProviderItem = {
    /** Provider ID */
    id: number;
    /** Provider name */
    name: string;
    /** Number of available phone numbers */
    numbersCount: number;
    /** SMS delivery success rate (0-100) */
    deliveryPercent: number;
    /** Number lifetime in seconds */
    numberLifetime: number;
};

// ─── Tiger SMS Specific Types ───

/**
 * Tiger SMS status codes for setStatus action
 */
export const TIGER_SMS_STATUS_CODES = {
    ready: 1, // Number is ready for SMS
    retry: 3, // Request new SMS on same number
    complete: 6, // Activation completed successfully
    cancel: 8, // Cancel activation
} as const;

/**
 * Tiger SMS response status strings
 */
export const TIGER_SMS_RESPONSE_STATUS = {
    ACCESS_BALANCE: "ACCESS_BALANCE",
    ACCESS_NUMBER: "ACCESS_NUMBER",
    ACCESS_READY: "ACCESS_READY",
    ACCESS_RETRY_GET: "ACCESS_RETRY_GET",
    ACCESS_ACTIVATION: "ACCESS_ACTIVATION",
    ACCESS_CANCEL: "ACCESS_CANCEL",
    STATUS_WAIT_CODE: "STATUS_WAIT_CODE",
    STATUS_WAIT_RETRY: "STATUS_WAIT_RETRY",
    STATUS_WAIT_RESEND: "STATUS_WAIT_RESEND",
    STATUS_CANCEL: "STATUS_CANCEL",
    STATUS_OK: "STATUS_OK",
    BAD_KEY: "BAD_KEY",
    ERROR_SQL: "ERROR_SQL",
    BAD_ACTION: "BAD_ACTION",
    BAD_SERVICE: "BAD_SERVICE",
    BAD_COUNTRY: "BAD_COUNTRY",
    NO_NUMBERS: "NO_NUMBERS",
    NO_BALANCE: "NO_BALANCE",
    NO_ACTIVATION: "NO_ACTIVATION",
    BAD_STATUS: "BAD_STATUS",
    BANNED: "BANNED",
} as const;

// ─── SMS-Man Specific Types ───

/**
 * SMS-Man status strings for setStatus action
 */
export const SMS_MAN_STATUS_STRINGS = {
    ready: "ready",
    complete: "close",
    cancel: "reject",
} as const;

/**
 * SMS-Man error codes
 */
export const SMS_MAN_ERROR_CODES = {
    wait_sms: "Waiting for SMS",
    error: "General error",
    not_enough_balance: "Insufficient balance",
    not_enough_funds: "Insufficient funds",
    no_free_phones: "No numbers available",
    access_denied: "Access denied",
    invalid_token: "Invalid API token",
    no_number: "No activation found",
    wrong_request: "Wrong request format",
} as const;
