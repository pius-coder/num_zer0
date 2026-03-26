/**
 * Fapshi Payment SDK - Balance Resource
 *
 * Handles balance-related operations.
 */

import type { Result } from "@/packages/result";
import { FapshiError } from "../errors";
import type { BalanceResponse } from "../types";

/**
 * API endpoints for balance
 */
const ENDPOINTS = {
    GET_BALANCE: "/balance",
} as const;

/**
 * BalanceResource - Handles balance operations
 */
export class BalanceResource {
    constructor(private client: import("../client").FapshiClient) {}

    /**
     * Get account balance
     * 
     * @returns Result containing balance information
     */
    async get(): Promise<Result<BalanceResponse, FapshiError>> {
        // Make API request
        const result = await this.client.request<BalanceResponse>({
            method: "GET",
            path: ENDPOINTS.GET_BALANCE,
        });

        return result;
    }
}
