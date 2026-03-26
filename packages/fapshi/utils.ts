/**
 * Fapshi Payment SDK - Validation Utilities
 *
 * Runtime validation helpers for Fapshi API parameters.
 */

import { createValidationError } from "./errors";

/**
 * Validates that amount is a positive integer >= 100
 * @throws FapshiError if validation fails
 */
export function validateAmount(amount: number): void {
    if (!Number.isInteger(amount)) {
        throw createValidationError("Amount must be an integer", {
            amount: ["Amount must be an integer"],
        });
    }
    if (amount < 100) {
        throw createValidationError("Amount must be at least 100", {
            amount: ["Amount must be at least 100"],
        });
    }
}

/**
 * Validates user ID format: alphanumeric with hyphens and underscores, 1-100 chars
 * @throws FapshiError if validation fails
 */
export function validateUserId(userId: string): void {
    if (!userId || userId.length === 0) {
        throw createValidationError("User ID is required", {
            userId: ["User ID is required"],
        });
    }
    if (userId.length > 100) {
        throw createValidationError("User ID must be 100 characters or less", {
            userId: ["User ID must be 100 characters or less"],
        });
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(userId)) {
        throw createValidationError(
            "User ID must contain only alphanumeric characters, hyphens, and underscores",
            {
                userId: [
                    "User ID must contain only alphanumeric characters, hyphens, and underscores",
                ],
            },
        );
    }
}

/**
 * Validates external ID format: same as userId
 * @throws FapshiError if validation fails
 */
export function validateExternalId(externalId: string): void {
    validateUserId(externalId); // Same validation rules
}

/**
 * Validates Cameroonian phone number format (9 digits starting with 6)
 * @throws FapshiError if validation fails
 */
export function validatePhone(phone: string): void {
    if (!phone || phone.length === 0) {
        throw createValidationError("Phone number is required", {
            phone: ["Phone number is required"],
        });
    }

    // Remove any spaces or dashes
    const cleaned = phone.replace(/[\s\-]/g, "");

    // Check if it's a valid Cameroonian number
    // Format: 9 digits starting with 6, optionally with +237 prefix
    const cameroonianPattern = /^(\+237)?[6][0-9]{8}$/;

    if (!cameroonianPattern.test(cleaned)) {
        throw createValidationError(
            "Phone number must be a valid Cameroonian number (9 digits starting with 6)",
            {
                phone: [
                    "Phone number must be a valid Cameroonian number (9 digits starting with 6)",
                ],
            },
        );
    }
}

/**
 * Validates transaction ID format
 * @throws FapshiError if validation fails
 */
export function validateTransId(transId: string): void {
    if (!transId || transId.length === 0) {
        throw createValidationError("Transaction ID is required", {
            transId: ["Transaction ID is required"],
        });
    }
    if (transId.length > 100) {
        throw createValidationError(
            "Transaction ID must be 100 characters or less",
            {
                transId: ["Transaction ID must be 100 characters or less"],
            },
        );
    }
}

/**
 * Validates that medium is in the allowed list
 * @throws FapshiError if validation fails
 */
export function validateMedium(medium: string, allowed: string[]): void {
    if (!allowed.includes(medium)) {
        const allowedStr = allowed.join(", ");
        throw createValidationError("Medium must be one of: " + allowedStr, {
            medium: ["Medium must be one of: " + allowedStr],
        });
    }
}

/**
 * Validates search limit is between 1 and 100
 * @throws FapshiError if validation fails
 */
export function validateSearchLimit(limit: number): void {
    if (!Number.isInteger(limit)) {
        throw createValidationError("Limit must be an integer", {
            limit: ["Limit must be an integer"],
        });
    }
    if (limit < 1 || limit > 100) {
        throw createValidationError("Limit must be between 1 and 100", {
            limit: ["Limit must be between 1 and 100"],
        });
    }
}

/**
 * Validates all required fields are present
 * @throws FapshiError if validation fails
 */
export function validateRequired(
    fields: Record<string, unknown>,
    fieldNames: string[],
): void {
    const missing: string[] = [];

    for (const name of fieldNames) {
        if (fields[name] === undefined || fields[name] === null) {
            missing.push(name);
        }
    }

    if (missing.length > 0) {
        const missingStr = missing.join(", ");
        throw createValidationError("Missing required fields: " + missingStr, {
            fields: missing.map((f) => f + " is required"),
        });
    }
}
