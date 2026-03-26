/**
 * SMS Provider Factory
 *
 * Creates SMS provider adapters based on configuration.
 */

import { ProviderType, SmsProviderConfig } from "./types";
import { SmsProviderAdapter } from "./adapter";
import { createTigerSmsAdapter, createSmsManAdapter } from "./adapters";

/**
 * Creates an SMS provider adapter based on the provider type.
 *
 * @param config - Configuration for the SMS provider
 * @returns An instance of the appropriate SMS provider adapter
 * @throws Error if the provider type is not supported
 *
 * @example
 * ```typescript
 * const adapter = createSmsProviderAdapter({
 *   type: "tiger-sms",
 *   apiKey: "your-api-key",
 *   baseUrl: "https://tiger-sms.com/api",
 * });
 *
 * const balance = await adapter.getBalance();
 * ```
 */
export function createSmsProviderAdapter(config: SmsProviderConfig): SmsProviderAdapter {
    switch (config.type) {
        case "tiger-sms":
            return createTigerSmsAdapter({
                apiKey: config.apiKey,
                baseUrl: config.baseUrl,
                timeout: config.timeout,
            });

        case "sms-man":
            return createSmsManAdapter({
                apiKey: config.apiKey,
                baseUrl: config.baseUrl,
                timeout: config.timeout,
            });

        default:
            throw new Error(`Unsupported SMS provider type: ${(config as { type: string }).type}`);
    }
}

/**
 * Type guard to check if a provider type is supported
 */
export function isSupportedProviderType(type: string): type is ProviderType {
    return type === "tiger-sms" || type === "sms-man";
}

/**
 * Gets the list of supported provider types
 */
export function getSupportedProviderTypes(): ProviderType[] {
    return ["tiger-sms", "sms-man"];
}
