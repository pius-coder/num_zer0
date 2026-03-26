/**
 * SMS Provider Package
 *
 * A unified adapter interface for multiple SMS verification providers.
 * Supports Tiger SMS and SMS-Man APIs.
 *
 * @example
 * ```typescript
 * import { createSmsProviderAdapter } from "@/packages/sms-provider";
 *
 * const adapter = createSmsProviderAdapter({
 *   type: "tiger-sms",
 *   apiKey: process.env.TIGER_SMS_API_KEY,
 *   baseUrl: "https://tiger-sms.com/api",
 * });
 *
 * // Get balance
 * const balanceResult = await adapter.getBalance();
 * if (balanceResult.ok) {
 *   console.log(`Balance: ${balanceResult.data.balance}`);
 * }
 *
 * // Request a number
 * const numberResult = await adapter.getNumber({
 *   serviceCode: "wa",
 *   countryId: "US",
 * });
 * if (numberResult.ok) {
 *   console.log(`Phone: ${numberResult.data.phoneNumber}`);
 * }
 * ```
 */

// Types
export type {
    ProviderType,
    SmsProviderConfig,
    BalanceResponse,
    NumberResponse,
    SmsStatus,
    StatusResponse,
    ActivationAction,
    SetStatusResponse,
    GetNumberParams,
    PriceEntry,
    PricesResponse,
    ServiceItem,
    CountryItem,
    ProviderItem,
} from "./types";

// Constants
export {
    TIGER_SMS_STATUS_CODES,
    TIGER_SMS_RESPONSE_STATUS,
    SMS_MAN_STATUS_STRINGS,
    SMS_MAN_ERROR_CODES,
} from "./types";

// Errors
export {
    SmsProviderError,
    SMS_ERROR_CODES,
    isSmsProviderError,
    getErrorMessage,
} from "./errors";

// Adapter interface
export type { SmsProviderAdapter, AdapterConfig } from "./adapter";

// Adapters
export {
    TigerSmsAdapter,
    createTigerSmsAdapter,
    SmsManAdapter,
    createSmsManAdapter,
} from "./adapters";

// Factory
export {
    createSmsProviderAdapter,
    isSupportedProviderType,
    getSupportedProviderTypes,
} from "./factory";
