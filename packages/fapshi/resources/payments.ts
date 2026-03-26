/**
 * Fapshi Payment SDK - Payments Resource
 *
 * Handles payment-related operations.
 */

import type { Result } from "@/packages/result";
import { FapshiError } from "../errors";
import {
    validateAmount,
    validatePhone,
    validateTransId,
    validateUserId,
    validateExternalId,
    validateMedium,
} from "../utils";
import type {
    GenerateLinkRequest,
    GenerateLinkResponse,
    DirectPayRequest,
    DirectPayResponse,
    Transaction,
    PaymentMedium,
} from "../types";

/**
 * API endpoints for payments
 */
const ENDPOINTS = {
    INITIATE_PAY: "/initiate-pay",
    DIRECT_PAY: "/direct-pay",
    PAYMENT_STATUS: "/payment-status",
    EXPIRE_PAY: "/expire-pay",
} as const;

/**
 * PaymentsResource - Handles payment operations
 */
export class PaymentsResource {
    constructor(private client: import("../client").FapshiClient) {}

    /**
     * Generate a payment link
     * 
     * @param params - Payment parameters
     * @returns Result containing the payment link and transaction ID
     */
    async generateLink(
        params: GenerateLinkRequest
    ): Promise<Result<GenerateLinkResponse, FapshiError>> {
        // Validate amount
        try {
            validateAmount(params.amount);
            if (params.userId) validateUserId(params.userId);
            if (params.externalId) validateExternalId(params.externalId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<GenerateLinkResponse, FapshiError>;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<GenerateLinkResponse>({
            method: "POST",
            path: ENDPOINTS.INITIATE_PAY,
            body: {
                amount: params.amount,
                email: params.email,
                redirectUrl: params.redirectUrl,
                userId: params.userId,
                externalId: params.externalId,
                message: params.message,
            },
        });

        return result;
    }

    /**
     * Process a direct payment
     * 
     * @param params - Payment parameters including phone number
     * @returns Result containing the transaction ID
     */
    async directPay(
        params: DirectPayRequest
    ): Promise<Result<DirectPayResponse, FapshiError>> {
        // Validate inputs
        try {
            validateAmount(params.amount);
            validatePhone(params.phone);
            if (params.medium) {
                validateMedium(params.medium, ["mobile money", "orange money"]);
            }
            if (params.userId) validateUserId(params.userId);
            if (params.externalId) validateExternalId(params.externalId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<DirectPayResponse, FapshiError>;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<DirectPayResponse>({
            method: "POST",
            path: ENDPOINTS.DIRECT_PAY,
            body: {
                amount: params.amount,
                phone: params.phone,
                medium: params.medium,
                name: params.name,
                email: params.email,
                userId: params.userId,
                externalId: params.externalId,
                message: params.message,
            },
        });

        return result;
    }

    /**
     * Get payment status
     * 
     * @param transId - Transaction ID
     * @returns Result containing the transaction details
     */
    async getStatus(transId: string): Promise<Result<Transaction, FapshiError>> {
        // Validate transaction ID
        try {
            validateTransId(transId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<Transaction, FapshiError>;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<Transaction>({
            method: "GET",
            path: ENDPOINTS.PAYMENT_STATUS + "/" + transId,
        });

        return result;
    }

    /**
     * Expire a payment link
     * 
     * @param transId - Transaction ID
     * @returns Result containing the expired transaction
     */
    async expire(transId: string): Promise<Result<Transaction, FapshiError>> {
        // Validate transaction ID
        try {
            validateTransId(transId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<Transaction, FapshiError>;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<Transaction>({
            method: "POST",
            path: ENDPOINTS.EXPIRE_PAY,
            body: { transId },
        });

        return result;
    }
}
