/**
 * Fapshi Payment SDK - Webhook Helper
 *
 * Utility for parsing and validating webhook payloads from Fapshi.
 * 
 * SECURITY: Fapshi does not provide webhook signature verification.
 * Secure your endpoint with IP whitelisting, HTTPS, secret query params, or rate limiting.
 */

import { Ok, Err, type Result } from "@/packages/result";
import { createValidationError } from "./errors";
import type { Transaction } from "./types";

/**
 * Required fields for a valid webhook payload
 */
const REQUIRED_FIELDS = [
    "transId",
    "status",
    "amount",
    "dateInitiated",
] as const;

/**
 * Parses and validates a webhook payload from Fapshi
 * 
 * @param body - Raw JSON string or parsed object from webhook request
 * @returns Result containing validated Transaction object or error
 * 
 * @example
 * // Parse webhook payload
 * const result = parseWebhookPayload(requestBody);
 * if (result.ok) {
 *   const transaction = result.data;
 *   // Process transaction
 * }
 */
export function parseWebhookPayload(
    body: string | Record<string, unknown>
): Result<Transaction, Error> {
    let payload: Record<string, unknown>;

    // Parse JSON if string
    if (typeof body === "string") {
        try {
            payload = JSON.parse(body);
        } catch (error) {
            return Err(new Error("Invalid JSON payload"));
        }
    } else {
        payload = body;
    }

    // Validate required fields
    const missingFields: string[] = [];
    for (const field of REQUIRED_FIELDS) {
        if (!(field in payload) || payload[field] === undefined) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        return Err(
            createValidationError(
                "Missing required fields: " + missingFields.join(", "),
                {
                    fields: missingFields.map((f) => f + " is required"),
                }
            )
        );
    }

    // Validate types of required fields
    if (typeof payload.transId !== "string") {
        return Err(new Error("transId must be a string"));
    }

    if (typeof payload.status !== "string") {
        return Err(new Error("status must be a string"));
    }

    if (typeof payload.amount !== "number") {
        return Err(new Error("amount must be a number"));
    }

    if (typeof payload.dateInitiated !== "string") {
        return Err(new Error("dateInitiated must be a string"));
    }

    // Cast to Transaction type
    return Ok(payload as Transaction);
}

/**
 * Type guard to check if an object is a valid Transaction
 * 
 * @param obj - Object to check
 * @returns true if object has all required Transaction fields
 */
export function isValidTransaction(obj: unknown): obj is Transaction {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }

    const record = obj as Record<string, unknown>;

    return (
        typeof record.transId === "string" &&
        typeof record.status === "string" &&
        typeof record.amount === "number" &&
        typeof record.dateInitiated === "string"
    );
}
