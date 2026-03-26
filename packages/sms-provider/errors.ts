/**
 * SMS Provider Package - Error Handling
 *
 * Unified error handling for all SMS provider adapters.
 * Maps provider-specific errors to a common error type.
 */

/**
 * SMS Provider specific error class
 */
export class SmsProviderError extends Error {
    /**
     * Creates a new SMS provider error
     * @param code - Error code from the provider
     * @param message - Human-readable error message
     * @param provider - Provider name (e.g., "tiger-sms", "sms-man")
     * @param httpStatus - HTTP status code if applicable
     */
    constructor(
        public readonly code: string,
        message: string,
        public readonly provider: string,
        public readonly httpStatus?: number,
    ) {
        super(message);
        this.name = "SmsProviderError";
    }

    /**
     * Creates a user-friendly string representation
     */
    override toString(): string {
        return `SmsProviderError [${this.provider}]: ${this.code} - ${this.message}`;
    }

    /**
     * Creates a JSON representation for logging
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            provider: this.provider,
            httpStatus: this.httpStatus,
        };
    }
}

/**
 * Unified error codes mapped from both providers
 */
export const SMS_ERROR_CODES = {
    /** Invalid API key */
    BAD_KEY: "Invalid API key",
    /** No phone numbers available for the requested service/country */
    NO_NUMBERS: "No numbers available",
    /** Insufficient account balance */
    NO_BALANCE: "Insufficient balance",
    /** Invalid service code */
    BAD_SERVICE: "Invalid service",
    /** Invalid country ID */
    BAD_COUNTRY: "Invalid country",
    /** Invalid activation ID */
    NO_ACTIVATION: "Invalid activation ID",
    /** Invalid status transition */
    BAD_STATUS: "Invalid status transition",
    /** Rate limited - too many requests */
    RATE_LIMITED: "Too many requests",
    /** Network/connection error */
    NETWORK_ERROR: "Network error",
    /** Failed to parse provider response */
    PARSE_ERROR: "Failed to parse provider response",
    /** Unknown error */
    UNKNOWN: "Unknown error",
    /** Account banned */
    BANNED: "Account banned",
    /** SQL error on provider side */
    SQL_ERROR: "Provider database error",
    /** Invalid action parameter */
    BAD_ACTION: "Invalid action",
    /** Access denied */
    ACCESS_DENIED: "Access denied",
    /** Wrong request format */
    WRONG_REQUEST: "Wrong request format",
} as const;

/**
 * Error code type
 */
export type SmsErrorCode = keyof typeof SMS_ERROR_CODES;

/**
 * Maps Tiger SMS error strings to unified error codes
 */
export const TIGER_SMS_ERROR_MAP: Record<string, SmsErrorCode> = {
    BAD_KEY: "BAD_KEY",
    ERROR_SQL: "SQL_ERROR",
    BAD_ACTION: "BAD_ACTION",
    BAD_SERVICE: "BAD_SERVICE",
    BAD_COUNTRY: "BAD_COUNTRY",
    NO_NUMBERS: "NO_NUMBERS",
    NO_BALANCE: "NO_BALANCE",
    NO_ACTIVATION: "NO_ACTIVATION",
    BAD_STATUS: "BAD_STATUS",
    BANNED: "BANNED",
};

/**
 * Maps SMS-Man error strings to unified error codes
 */
export const SMS_MAN_ERROR_MAP: Record<string, SmsErrorCode> = {
    error: "UNKNOWN",
    not_enough_balance: "NO_BALANCE",
    not_enough_funds: "NO_BALANCE",
    no_free_phones: "NO_NUMBERS",
    access_denied: "ACCESS_DENIED",
    invalid_token: "BAD_KEY",
    no_number: "NO_ACTIVATION",
    wrong_request: "WRONG_REQUEST",
};

/**
 * Creates a network error
 */
export function createNetworkError(provider: string, originalError: unknown): SmsProviderError {
    const message =
        originalError instanceof Error ? originalError.message : "Network request failed";
    return new SmsProviderError("NETWORK_ERROR", message, provider);
}

/**
 * Creates a parse error
 */
export function createParseError(
    provider: string,
    rawResponse: string,
    originalError?: unknown,
): SmsProviderError {
    const details = originalError instanceof Error ? `: ${originalError.message}` : "";
    const truncated = rawResponse.length > 100 ? rawResponse.slice(0, 100) + "..." : rawResponse;
    return new SmsProviderError(
        "PARSE_ERROR",
        `Failed to parse response: "${truncated}"${details}`,
        provider,
    );
}

/**
 * Creates an unknown error
 */
export function createUnknownError(provider: string, details: string): SmsProviderError {
    return new SmsProviderError("UNKNOWN", details, provider);
}

/**
 * Checks if an error is an SMS provider error
 */
export function isSmsProviderError(error: unknown): error is SmsProviderError {
    return error instanceof SmsProviderError;
}

/**
 * Gets a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (isSmsProviderError(error)) {
        const description = SMS_ERROR_CODES[error.code as SmsErrorCode];
        return description || error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}
