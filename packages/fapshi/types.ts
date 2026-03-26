/**
 * Fapshi Payment SDK - Type Definitions
 *
 * This file contains all shared types for the Fapshi Payment SDK.
 */

// ─── Configuration Types ───

/**
 * Environment type for Fapshi API
 */
export type Environment = "sandbox" | "live";

/**
 * Configuration for creating a Fapshi client
 */
export type FapshiConfig = {
    /** API user identifier */
    apiUser: string;
    /** API key for authentication */
    apiKey: string;
    /** Environment: sandbox or live (default: sandbox) */
    environment?: Environment;
    /** Base URL override (for advanced use) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
};

// ─── Enum Types ───

/**
 * Transaction status values
 */
export type TransactionStatus =
    | "CREATED"
    | "PENDING"
    | "SUCCESSFUL"
    | "FAILED"
    | "EXPIRED";

/**
 * Payment medium types
 */
export type PaymentMedium = "mobile money" | "orange money";

/**
 * Payout medium types
 */
export type PayoutMedium = "mobile money" | "orange money" | "fapshi";

// ─── Payment Types ───

/**
 * Request to generate a payment link
 */
export type GenerateLinkRequest = {
    /** Payment amount (minimum 100) */
    amount: number;
    /** Payer email (optional) */
    email?: string;
    /** Redirect URL after payment (optional) */
    redirectUrl?: string;
    /** User identifier (optional) */
    userId?: string;
    /** External reference ID (optional) */
    externalId?: string;
    /** Payment message (optional) */
    message?: string;
};

/**
 * Response from generating a payment link
 */
export type GenerateLinkResponse = {
    /** Payment link URL */
    link: string;
    /** Transaction ID */
    transId: string;
    /** Date initiated */
    dateInitiated: string;
};

/**
 * Request for direct payment
 */
export type DirectPayRequest = {
    /** Payment amount (minimum 100) */
    amount: number;
    /** Phone number for payment */
    phone: string;
    /** Payment medium (optional) */
    medium?: PaymentMedium;
    /** Payer name (optional) */
    name?: string;
    /** Payer email (optional) */
    email?: string;
    /** User identifier (optional) */
    userId?: string;
    /** External reference ID (optional) */
    externalId?: string;
    /** Payment message (optional) */
    message?: string;
};

/**
 * Response from direct payment
 */
export type DirectPayResponse = {
    /** Transaction ID */
    transId: string;
    /** Date initiated */
    dateInitiated: string;
};

// ─── Transaction Types ───

/**
 * Full transaction object
 */
export type Transaction = {
    /** Transaction ID */
    transId: string;
    /** Transaction status */
    status: TransactionStatus;
    /** Payment medium */
    medium?: PaymentMedium;
    /** Service name */
    serviceName?: string;
    /** Payment amount */
    amount: number;
    /** Revenue amount */
    revenue?: number;
    /** Payer name */
    payerName?: string;
    /** Payer email */
    email?: string;
    /** Redirect URL */
    redirectUrl?: string;
    /** External reference ID */
    externalId?: string;
    /** User identifier */
    userId?: string;
    /** Webhook URL */
    webhook?: string;
    /** Financial transaction ID */
    financialTransId?: string;
    /** Date initiated */
    dateInitiated: string;
    /** Date confirmed */
    dateConfirmed?: string;
};

/**
 * Search parameters for transactions
 */
export type SearchParams = {
    /** Filter by status */
    status?: TransactionStatus;
    /** Filter by medium */
    medium?: PaymentMedium;
    /** Start date filter */
    start?: string;
    /** End date filter */
    end?: string;
    /** Filter by amount */
    amt?: number;
    /** Limit results (1-100) */
    limit?: number;
    /** Sort order */
    sort?: string;
};

// ─── Payout Types ───

/**
 * Request for making a payout
 */
export type PayoutRequest = {
    /** Payout amount (minimum 100) */
    amount: number;
    /** Phone number (required for mobile/orange money) */
    phone?: string;
    /** Payout medium */
    medium?: PayoutMedium;
    /** Recipient name (optional) */
    name?: string;
    /** Recipient email (required for fapshi medium) */
    email?: string;
    /** User identifier (optional) */
    userId?: string;
    /** External reference ID (optional) */
    externalId?: string;
    /** Payout message (optional) */
    message?: string;
};

/**
 * Response from making a payout
 */
export type PayoutResponse = {
    /** Transaction ID */
    transId: string;
    /** Date initiated */
    dateInitiated: string;
};

// ─── Balance Types ───

/**
 * Balance response
 */
export type BalanceResponse = {
    /** Service name */
    service: string;
    /** Account balance */
    balance: number;
    /** Currency code */
    currency: string;
};

// ─── API Response Types ───

/**
 * Generic API response wrapper
 */
export type FapshiApiResponse<T> = T;
