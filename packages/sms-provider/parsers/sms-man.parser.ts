/**
 * SMS-Man Parser
 *
 * Parses JSON responses from SMS-Man API.
 * SMS-Man returns responses as JSON objects.
 *
 * Services/Countries are returned as objects keyed by ID:
 *   { "6": { id: "6", title: "Whatsapp", code: "wa" }, ... }
 */

import {
    SmsProviderError,
    SMS_MAN_ERROR_MAP,
    createParseError,
} from "../errors";
import {
    BalanceResponse,
    NumberResponse,
    StatusResponse,
    SetStatusResponse,
    PricesResponse,
    ServiceItem,
    CountryItem,
} from "../types";

const PROVIDER = "sms-man";

/**
 * Checks if the response contains an error
 */
function hasError(data: Record<string, unknown>): boolean {
    return data.success === false || (typeof data.error_code === "string" && data.error_code !== "");
}

/**
 * Parses an error from SMS-Man response
 */
function parseError(data: { error_code?: string; error_msg?: string }): SmsProviderError {
    const errorCode = data.error_code || "unknown";
    const errorMsg = typeof data.error_msg === "string" ? data.error_msg : JSON.stringify(data.error_msg);
    return new SmsProviderError(
        SMS_MAN_ERROR_MAP[errorCode] || "UNKNOWN",
        errorMsg,
        PROVIDER
    );
}

/**
 * Parses balance response
 * Response: { balance: "799.70" }
 */
export function parseBalance(data: { balance?: string; error_code?: string; error_msg?: string }): BalanceResponse {
    if (hasError(data)) {
        throw parseError(data);
    }

    if (typeof data.balance !== "string") {
        throw createParseError(PROVIDER, JSON.stringify(data));
    }

    const balance = parseFloat(data.balance);
    if (isNaN(balance)) {
        throw createParseError(PROVIDER, JSON.stringify(data), new Error("Invalid balance value"));
    }

    return { balance, currency: "RUB" };
}

/**
 * Parses getNumber response
 * Response: { request_id: 12345, country_id: 187, application_id: 1, number: "79001234567" }
 */
export function parseNumber(data: {
    request_id?: string | number;
    country_id?: string | number;
    application_id?: string | number;
    number?: string;
    error_code?: string;
    error_msg?: string;
}): NumberResponse {
    if (hasError(data)) {
        throw parseError(data);
    }

    if (!data.request_id || !data.number) {
        throw createParseError(PROVIDER, JSON.stringify(data));
    }

    return {
        activationId: String(data.request_id),
        phoneNumber: String(data.number),
    };
}

/**
 * Parses getStatus response
 * Response: { request_id: 12345, sms_code: "123456" } or { error_code: "wait_sms" }
 */
export function parseStatus(data: {
    request_id?: string | number;
    sms_code?: string;
    full_sms?: string;
    error_code?: string;
    error_msg?: string;
}, activationId: string): StatusResponse {
    // Check for waiting status (not really an error)
    if (data.error_code === "wait_sms") {
        return {
            activationId,
            status: "waiting",
        };
    }

    if (hasError(data) && !data.sms_code) {
        throw parseError(data);
    }

    // Code received
    if (data.sms_code) {
        return {
            activationId,
            status: "received",
            code: data.sms_code,
            fullSms: data.full_sms,
        };
    }

    // Unknown state
    return {
        activationId,
        status: "waiting",
    };
}

/**
 * Parses setStatus response
 * Response: { request_id: 12345, success: true }
 */
export function parseSetStatus(data: {
    request_id?: string | number;
    success?: boolean;
    error_code?: string;
    error_msg?: string;
}, activationId: string): SetStatusResponse {
    if (hasError(data)) {
        throw parseError(data);
    }

    return {
        activationId,
        success: data.success ?? true,
    };
}

/**
 * Parses services/applications response
 * API returns object: { "6": { id: "6", title: "Whatsapp", code: "wa" }, ... }
 */
export function parseServices(data: Record<string, { id?: string; name?: string; title?: string; code?: string }>): ServiceItem[] {
    if (typeof data !== "object" || data === null) {
        throw createParseError(PROVIDER, JSON.stringify(data));
    }

    const items: ServiceItem[] = [];
    for (const [key, item] of Object.entries(data)) {
        const name = (item.name || item.title || "").trim();
        if (item && name && item.code) {
            items.push({
                id: String(item.id || key),
                name: name,
                code: item.code.trim(),
            });
        }
    }
    return items;
}

/**
 * Parses countries response
 * API returns object: { "3": { id: "3", title: "China", code: "CN" }, ... }
 */
export function parseCountries(data: Record<string, { id?: string; title?: string; code?: string }>): CountryItem[] {
    if (typeof data !== "object" || data === null) {
        throw createParseError(PROVIDER, JSON.stringify(data));
    }

    const items: CountryItem[] = [];
    for (const [key, item] of Object.entries(data)) {
        if (item && item.title) {
            items.push({
                id: String(item.id || key),
                name: item.title,
                isoCode: item.code,
            });
        }
    }
    return items;
}

/**
 * Parses prices response
 * Response: { countryId: { serviceId: { cost: "1.5", count: 100 } } }
 */
export function parsePrices(data: Record<string, Record<string, { cost: string | number; count: number }>>): PricesResponse {
    if (typeof data !== "object" || data === null) {
        throw createParseError(PROVIDER, JSON.stringify(data));
    }

    const result: PricesResponse = {};

    for (const [countryId, services] of Object.entries(data)) {
        result[countryId] = {};
        for (const [serviceId, priceInfo] of Object.entries(services)) {
            result[countryId][serviceId] = {
                cost: typeof priceInfo.cost === "string" ? parseFloat(priceInfo.cost) : priceInfo.cost,
                count: priceInfo.count || 0,
            };
        }
    }

    return result;
}
