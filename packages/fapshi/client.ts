/**
 * Fapshi Payment SDK - Client
 *
 * Main HTTP client for Fapshi API.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Ok, Err, type Result } from "@/packages/result";
import { createModuleLogger } from "@/packages/logger";
import {
    FapshiError,
    createApiError,
    createNetworkError,
    FAPSHI_ERROR_CODES,
} from "./errors";
import type { FapshiConfig, Environment } from "./types";
import { PaymentsResource } from "./resources/payments";
import { TransactionsResource } from "./resources/transactions";
import { BalanceResource } from "./resources/balance";
import { PayoutsResource } from "./resources/payouts";

const logger = createModuleLogger("fapshi");

/**
 * Base URLs for different environments
 */
const BASE_URLS: Record<Environment, string> = {
    sandbox: "https://sandbox.fapshi.com",
    live: "https://live.fapshi.com",
};

/**
 * Request options for internal request method
 */
type RequestOptions = {
    method: "GET" | "POST";
    path: string;
    body?: Record<string, unknown>;
    params?: Record<string, string | number>;
};

/**
 * FapshiClient - Main SDK client class
 *
 * Handles HTTP communication with Fapshi API using axios.
 * All methods return Result<T, FapshiError> for type-safe error handling.
 */
export class FapshiClient {
    private client: AxiosInstance;
    private apiUser: string;
    private apiKey: string;

    // Resources will be initialized in constructor
    public payments: PaymentsResource;
    public transactions: TransactionsResource;
    public balance: BalanceResource;
    public payouts: PayoutsResource;

    constructor(config: FapshiConfig) {
        if (!config.apiUser || config.apiUser.trim() === '') {
            throw new Error('apiUser is required');
        }
        if (!config.apiKey || config.apiKey.trim() === '') {
            throw new Error('apiKey is required');
        }

        this.apiUser = config.apiUser;
        this.apiKey = config.apiKey;

        // Determine base URL
        const environment: Environment = config.environment || "sandbox";
        const baseUrl = config.baseUrl || BASE_URLS[environment];

        // Create axios instance
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Initialize resources
        this.payments = new PaymentsResource(this);
        this.transactions = new TransactionsResource(this);
        this.balance = new BalanceResource(this);
        this.payouts = new PayoutsResource(this);

        logger.info("Fapshi client initialized", { environment, baseUrl });
    }


    /**
     * Makes an API request to Fapshi
     *
     * @internal
     */
    async request<T>(options: RequestOptions): Promise<Result<T, FapshiError>> {
        const { method, path, body, params } = options;

        if (method === "GET" && body !== undefined) {
            throw new Error("Body is not allowed for GET requests");
        }

        try {
            const config: AxiosRequestConfig = {
                method,
                url: path,
                headers: {
                    apiuser: this.apiUser,
                    apikey: this.apiKey,
                },
            };

            // Add body for POST requests
            if (method === "POST" && body) {
                config.data = body;
            }

            // Add params for GET requests
            if (method === "GET" && params) {
                config.params = params;
            }

            logger.debug("Making request", { method, path });

            const response = await this.client.request<T>(config);

            logger.debug("Request successful", { method, path });

            return Ok(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error("Request failed", {
                    method,
                    path,
                    status: error.response?.status,
                    message: error.message,
                });

                // Handle API errors
                if (error.response) {
                    const statusCode = error.response.status;
                    const message =
                        error.response.data?.message || error.message;

                    return Err(createApiError(statusCode, message));
                }

                // Network error
                return Err(createNetworkError(error));
            }

            // Unknown error
            logger.error("Unexpected error", { error });
            return Err(createApiError(500, "Unknown error occurred"));
        }
    }
}
