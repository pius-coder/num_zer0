/**
 * Fapshi Payment SDK - Error Classes
 *
 * Custom error classes for the Fapshi SDK.
 */

/**
 * Base error class for Fapshi SDK errors
 */
export class FapshiError extends Error {
    constructor(
        public readonly code: string,
        public readonly statusCode: number,
        message: string,
        public readonly details?: Record<string, string[]>
    ) {
        super(message);
        this.name = "FapshiError";
    }
}

/**
 * Error codes for Fapshi SDK
 */
export const FAPSHI_ERROR_CODES = {
    BAD_REQUEST: "BAD_REQUEST",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NETWORK_ERROR: "NETWORK_ERROR",
    API_ERROR: "API_ERROR",
} as const;

/**
 * Creates a bad request error (400)
 */
export function createBadRequestError(
    message: string,
    details?: Record<string, string[]>
): FapshiError {
    return new FapshiError(
        FAPSHI_ERROR_CODES.BAD_REQUEST,
        400,
        message,
        details
    );
}

/**
 * Creates a forbidden error (403)
 */
export function createForbiddenError(message: string): FapshiError {
    return new FapshiError(
        FAPSHI_ERROR_CODES.FORBIDDEN,
        403,
        message
    );
}

/**
 * Creates a not found error (404)
 */
export function createNotFoundError(message: string): FapshiError {
    return new FapshiError(
        FAPSHI_ERROR_CODES.NOT_FOUND,
        404,
        message
    );
}

/**
 * Creates a validation error
 */
export function createValidationError(
    message: string,
    details?: Record<string, string[]>
): FapshiError {
    return new FapshiError(
        FAPSHI_ERROR_CODES.VALIDATION_ERROR,
        400,
        message,
        details
    );
}

/**
 * Creates a network error
 */
export function createNetworkError(error: unknown): FapshiError {
    const message = error instanceof Error 
        ? error.message 
        : "Network request failed";
    return new FapshiError(
        FAPSHI_ERROR_CODES.NETWORK_ERROR,
        0,
        message
    );
}

/**
 * Creates an API error from response
 */
export function createApiError(
    statusCode: number,
    message: string,
    details?: Record<string, string[]>
): FapshiError {
    return new FapshiError(
        FAPSHI_ERROR_CODES.API_ERROR,
        statusCode,
        message,
        details
    );
}

/**
 * Type guard to check if an error is a FapshiError
 */
export function isFapshiError(error: unknown): error is FapshiError {
    return error instanceof FapshiError;
}

/**
 * Gets a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (isFapshiError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unexpected error occurred";
}
