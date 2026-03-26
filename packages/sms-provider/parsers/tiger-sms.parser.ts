/**
 * Tiger SMS Parser
 *
 * Parses plain-text responses from Tiger SMS API.
 * Tiger SMS returns responses like "ACCESS_BALANCE:123.45" or "ACCESS_NUMBER:12345:79001234567"
 */

import {
    SmsProviderError,
    TIGER_SMS_ERROR_MAP,
    createParseError,
} from "../errors";
import {
    BalanceResponse,
    NumberResponse,
    StatusResponse,
    SetStatusResponse,
    PricesResponse,
    ProviderItem,
    SmsStatus,
    TIGER_SMS_RESPONSE_STATUS,
} from "../types";

const PROVIDER = "tiger-sms";

/**
 * Checks if the response is an error
 */
export function isError(response: string): boolean {
    return response in TIGER_SMS_ERROR_MAP;
}

/**
 * Parses an error response
 */
export function parseError(response: string): SmsProviderError | null {
    const errorCode = TIGER_SMS_ERROR_MAP[response];
    if (!errorCode) {
        return null;
    }
    return new SmsProviderError(errorCode, response, PROVIDER);
}

/**
 * Parses balance response
 * Format: "ACCESS_BALANCE:123.45"
 */
export function parseBalance(response: string): BalanceResponse {
    if (isError(response)) {
        throw parseError(response);
    }

    const prefix = TIGER_SMS_RESPONSE_STATUS.ACCESS_BALANCE + ":";
    if (!response.startsWith(prefix)) {
        throw createParseError(PROVIDER, response);
    }

    const balanceStr = response.slice(prefix.length);
    const balance = parseFloat(balanceStr);

    if (isNaN(balance)) {
        throw createParseError(PROVIDER, response, new Error("Invalid balance value"));
    }

    return { balance, currency: "RUB" };
}

/**
 * Parses getNumber response
 * Format: "ACCESS_NUMBER:{activationId}:{phoneNumber}"
 */
export function parseNumber(response: string): NumberResponse {
    if (isError(response)) {
        throw parseError(response);
    }

    const prefix = TIGER_SMS_RESPONSE_STATUS.ACCESS_NUMBER + ":";
    if (!response.startsWith(prefix)) {
        throw createParseError(PROVIDER, response);
    }

    const parts = response.slice(prefix.length).split(":");
    if (parts.length < 2) {
        throw createParseError(PROVIDER, response);
    }

    const [activationId, phoneNumber] = parts;

    return {
        activationId,
        phoneNumber,
    };
}

/**
 * Maps Tiger SMS status strings to unified SmsStatus
 */
function mapStatus(statusStr: string): SmsStatus {
    switch (statusStr) {
        case TIGER_SMS_RESPONSE_STATUS.STATUS_WAIT_CODE:
            return "waiting";
        case TIGER_SMS_RESPONSE_STATUS.STATUS_WAIT_RETRY:
        case TIGER_SMS_RESPONSE_STATUS.STATUS_WAIT_RESEND:
            return "retry";
        case TIGER_SMS_RESPONSE_STATUS.STATUS_OK:
            return "received";
        case TIGER_SMS_RESPONSE_STATUS.STATUS_CANCEL:
            return "cancelled";
        case TIGER_SMS_RESPONSE_STATUS.ACCESS_CANCEL:
            return "cancelled";
        case TIGER_SMS_RESPONSE_STATUS.ACCESS_READY:
            return "waiting";
        case TIGER_SMS_RESPONSE_STATUS.ACCESS_RETRY_GET:
            return "retry";
        case TIGER_SMS_RESPONSE_STATUS.ACCESS_ACTIVATION:
            return "waiting";
        default:
            return "waiting";
    }
}

/**
 * Parses getStatus response
 * Formats:
 * - "STATUS_WAIT_CODE" - waiting for SMS
 * - "STATUS_OK:123456" - code received
 * - "STATUS_WAIT_RETRY" - waiting for next SMS
 * - "STATUS_CANCEL" - cancelled
 */
export function parseStatus(response: string, activationId: string): StatusResponse {
    if (isError(response)) {
        throw parseError(response);
    }

    // Check for code received
    if (response.startsWith(TIGER_SMS_RESPONSE_STATUS.STATUS_OK + ":")) {
        const code = response.slice(TIGER_SMS_RESPONSE_STATUS.STATUS_OK.length + 1);
        return {
            activationId,
            status: "received",
            code,
        };
    }

    // Map status string to unified status
    const status = mapStatus(response);

    return {
        activationId,
        status,
    };
}

/**
 * Parses setStatus response
 * Formats:
 * - "ACCESS_READY" - number ready
 * - "ACCESS_RETRY_GET" - retry requested
 * - "ACCESS_CANCEL" - cancelled
 * - "ACCESS_ACTIVATION" - completed
 */
export function parseSetStatus(response: string, activationId: string): SetStatusResponse {
    if (isError(response)) {
        throw parseError(response);
    }

    const successMap: Record<string, { success: boolean; newStatus: string }> = {
        [TIGER_SMS_RESPONSE_STATUS.ACCESS_READY]: { success: true, newStatus: "ready" },
        [TIGER_SMS_RESPONSE_STATUS.ACCESS_RETRY_GET]: { success: true, newStatus: "retry" },
        [TIGER_SMS_RESPONSE_STATUS.ACCESS_CANCEL]: { success: true, newStatus: "cancelled" },
        [TIGER_SMS_RESPONSE_STATUS.ACCESS_ACTIVATION]: { success: true, newStatus: "complete" },
    };

    const result = successMap[response];
    if (!result) {
        throw createParseError(PROVIDER, response);
    }

    return {
        activationId,
        success: result.success,
        newStatus: result.newStatus,
    };
}

/**
 * Parses prices response (JSON format)
 * Tiger SMS returns prices as JSON: { countryId: { serviceCode: { cost, count } } }
 */
export function parsePrices(response: string): PricesResponse {
    try {
        const data = JSON.parse(response);
        // Validate structure
        if (typeof data !== "object" || data === null) {
            throw new Error("Invalid prices structure");
        }
        return data as PricesResponse;
    } catch (e) {
        throw createParseError(PROVIDER, response, e);
    }
}

/**
 * Parses providers response (JSON array)
 * Tiger SMS returns providers as JSON array
 */
export function parseProviders(response: string): ProviderItem[] {
    try {
        let jsonStr = response;

        // If it starts with HTML tags, try to extract the JSON array [...]
        if (response.trim().startsWith("<")) {
            const match = response.match(/\[[\s\S]*\]/);
            if (match) {
                jsonStr = match[0];
            }
        }

        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) {
            throw new Error("Expected array");
        }
        return data as ProviderItem[];
    } catch (e) {
        throw createParseError(PROVIDER, response, e);
    }
}
