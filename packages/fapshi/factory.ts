/**
 * Fapshi Payment SDK - Factory
 *
 * Factory function for creating Fapshi client instances.
 */

import { FapshiClient } from "./client";
import type { FapshiConfig } from "./types";

/**
 * Creates a Fapshi client instance
 * 
 * @param config - Configuration options
 * @returns FapshiClient instance
 * 
 * @example
 * // Create a sandbox client
 * const client = createFapshiClient({
 *   apiUser: "your-api-user",
 *   apiKey: "your-api-key",
 *   environment: "sandbox"
 * });
 * 
 * // Create a live client
 * const client = createFapshiClient({
 *   apiUser: process.env.FAPSHI_API_USER,
 *   apiKey: process.env.FAPSHI_API_KEY,
 *   environment: "live"
 * });
 */
export function createFapshiClient(config: FapshiConfig): FapshiClient {
    return new FapshiClient(config);
}
