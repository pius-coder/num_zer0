/**
 * Fapshi Payment SDK - Transactions Resource
 *
 * Handles transaction-related operations.
 */

import type { Result } from "@/packages/result";
import { FapshiError } from "../errors";
import { validateUserId, validateSearchLimit } from "../utils";
import type { Transaction, SearchParams } from "../types";

/**
 * API endpoints for transactions
 */
const ENDPOINTS = {
    GET_BY_USER: "/transaction",
    SEARCH: "/search",
} as const;

/**
 * TransactionsResource - Handles transaction operations
 */
export class TransactionsResource {
    constructor(private client: import("../client").FapshiClient) {}

    /**
     * Get transactions by user ID
     * 
     * @param userId - User identifier
     * @returns Result containing array of transactions
     */
    async getByUserId(userId: string): Promise<Result<Transaction[], FapshiError>> {
        // Validate user ID
        try {
            validateUserId(userId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<Transaction[], FapshiError>;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<Transaction[]>({
            method: "GET",
            path: ENDPOINTS.GET_BY_USER + "/" + userId,
        });

        return result;
    }

    /**
     * Search transactions with filters
     * 
     * @param params - Search parameters (all optional)
     * @returns Result containing array of matching transactions
     */
    async search(params?: SearchParams): Promise<Result<Transaction[], FapshiError>> {
        // Validate search parameters
        if (params) {
            try {
                if (params.limit !== undefined) {
                    validateSearchLimit(params.limit);
                }
            } catch (error) {
                if (error instanceof FapshiError) {
                    return { ok: false, error } as Result<Transaction[], FapshiError>;
                }
                throw error;
            }
        }

        // Build query parameters
        const queryParams: Record<string, string | number> = {};
        
        if (params) {
            if (params.status) queryParams.status = params.status;
            if (params.medium) queryParams.medium = params.medium;
            if (params.start) queryParams.start = params.start;
            if (params.end) queryParams.end = params.end;
            if (params.amt !== undefined) queryParams.amt = params.amt;
            if (params.limit !== undefined) queryParams.limit = params.limit;
            if (params.sort) queryParams.sort = params.sort;
        }

        // Make API request
        const result = await this.client.request<Transaction[]>({
            method: "GET",
            path: ENDPOINTS.SEARCH,
            params: queryParams,
        });

        return result;
    }
}
